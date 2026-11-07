#!/usr/bin/env python3
"""Create a reproducible, English-language narration and exact scene timing.
No paid APIs, no repository changes outside video-demo/.
"""
from __future__ import annotations

import json
import subprocess
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
VOICE = ROOT / "_voice"
OUT.mkdir(parents=True, exist_ok=True)
VOICE.mkdir(parents=True, exist_ok=True)

# Alba is British English. Its MODEL_CARD names CC BY 4.0 as the dataset licence.
# Attribution is included in the downloadable artefact and MP4 metadata.
MODEL_NAME = "en_GB-alba-medium"
VOICE_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/"
LEAD_SECONDS = 1.0
PAUSE_SECONDS = 0.70
TAIL_SECONDS = 1.0

SCENES = [
    {
        "id": "introduction",
        "text": "Welcome to Strategic Resilience Intelligence. In this fictional aerospace example, a test-bench control module has failed. We will explore how recovery decisions affect operational resilience.",
    },
    {
        "id": "choose_repair",
        "text": "Choose Repair First. Under the original assumptions, the average time to recover an operational module is fifty days. This is a probability-weighted average, not the duration of the physical repair.",
    },
    {
        "id": "inspect",
        "text": "Open the analysis to examine possible outcomes. Each route has its own timing, costs, and risks. The figures are calculated from the assumptions, which we can change.",
    },
    {
        "id": "modify",
        "text": "Now open Change Conditions. Increase repair feasibility from seventy-five to ninety percent. Expected recovery time falls to thirty-six point eight days, because a successful repair becomes more likely.",
    },
    {
        "id": "explain",
        "text": "The model explains why the values change, using probabilities and possible outcomes. All figures here are fictional. The same analytical approach can later be tested with verified case data.",
    },
]


def download(url: str, dest: Path) -> None:
    if dest.is_file() and dest.stat().st_size > 10_000:
        return
    print(f"Fetching {dest.name}", flush=True)
    request = urllib.request.Request(url, headers={"User-Agent": "ASRI-Demo/1.0"})
    with urllib.request.urlopen(request, timeout=120) as source, dest.open("wb") as sink:
        while chunk := source.read(1024 * 1024):
            sink.write(chunk)
    if dest.stat().st_size < 1024:
        raise RuntimeError(f"Downloaded file is unexpectedly small: {dest}")


def srt_time(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, rem = divmod(milliseconds, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, ms = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def main() -> None:
    model = VOICE / f"{MODEL_NAME}.onnx"
    config = VOICE / f"{MODEL_NAME}.onnx.json"
    download(VOICE_BASE + model.name + "?download=true", model)
    download(VOICE_BASE + config.name + "?download=true", config)

    clips: list[tuple[dict, bytes, float]] = []
    sample_rate = channels = sample_width = None
    for i, scene in enumerate(SCENES, start=1):
        wav_file = OUT / f"voice-{i:02d}.wav"
        print(f"Synthesizing scene {i}: {scene['id']}", flush=True)
        subprocess.run(
            ["piper", "--model", str(model), "--config", str(config),
             "--output_file", str(wav_file)],
            input=scene["text"].encode("utf-8"), check=True,
        )
        with wave.open(str(wav_file), "rb") as audio:
            rate, ch, width = audio.getframerate(), audio.getnchannels(), audio.getsampwidth()
            if sample_rate is None:
                sample_rate, channels, sample_width = rate, ch, width
            if (rate, ch, width) != (sample_rate, channels, sample_width):
                raise RuntimeError("Piper output formats vary between scenes.")
            frames = audio.readframes(audio.getnframes())
            duration = audio.getnframes() / rate
            clips.append((scene, frames, duration))

    assert sample_rate and channels and sample_width
    silence_frame = b"\x00" * channels * sample_width
    def silence(seconds: float) -> bytes:
        return silence_frame * round(seconds * sample_rate)

    time = LEAD_SECONDS
    manifest: dict = {
        "voice": MODEL_NAME,
        "voice_attribution": "Piper en_GB-alba-medium; dataset CC BY 4.0",
        "lead_seconds": LEAD_SECONDS,
        "pause_seconds": PAUSE_SECONDS,
        "tail_seconds": TAIL_SECONDS,
        "scenes": [],
    }
    subtitles = []
    with wave.open(str(OUT / "narration.wav"), "wb") as stitched:
        stitched.setnchannels(channels)
        stitched.setsampwidth(sample_width)
        stitched.setframerate(sample_rate)
        stitched.writeframes(silence(LEAD_SECONDS))
        for i, (scene, data, duration) in enumerate(clips, start=1):
            scene_start = time
            scene_end = time + duration
            stitched.writeframes(data)
            stitched.writeframes(silence(PAUSE_SECONDS))
            subtitles.append(f"{i}\n{srt_time(scene_start)} --> {srt_time(scene_end)}\n{scene['text']}\n")
            manifest["scenes"].append({
                "id": scene["id"],
                "text": scene["text"],
                "start_seconds": round(scene_start, 3),
                "voice_seconds": round(duration, 3),
                "hold_seconds": round(duration + PAUSE_SECONDS, 3),
            })
            time = scene_end + PAUSE_SECONDS
        stitched.writeframes(silence(TAIL_SECONDS))
    manifest["duration_seconds"] = round(time + TAIL_SECONDS, 3)
    (OUT / "timeline.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (OUT / "subtitles.srt").write_text("\n".join(subtitles), encoding="utf-8")
    (OUT / "voice-credits.txt").write_text(
        "Narration generated locally with Piper TTS; voice: en_GB-alba-medium.\n"
        "Voice dataset attribution: The University of Edinburgh / DataShare "
        "(https://datashare.ed.ac.uk/handle/10283/3270), CC BY 4.0.\n"
        "Voice files: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/alba/medium\n"
        "The case and all quantitative assumptions are fictional, not Airbus performance data.\n",
        encoding="utf-8",
    )
    print(f"Created narration ({manifest['duration_seconds']} seconds including pauses).", flush=True)


if __name__ == "__main__":
    main()
