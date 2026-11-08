#!/usr/bin/env python3
"""Generate the complete tutorial with Castilian Spanish voice and unobtrusive subtitles.
Every spoken cue is synthesized separately so its subtitle start/end are exact.
Only local open-source speech synthesis is used; no TTS API or credits.
"""
from __future__ import annotations
import json
import subprocess
import textwrap
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
VOICE = ROOT / "_voice"
OUT.mkdir(parents=True, exist_ok=True)
VOICE.mkdir(parents=True, exist_ok=True)
MODEL_NAME = "es_ES-davefx-medium"
VOICE_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/"
LEAD = 1.20
CUE_PAUSE = 0.90
CHAPTER_PAUSE = 2.0
TAIL = 2.0
CAPTION_WRAP = 78


def download(url: str, target: Path) -> None:
    if target.exists() and target.stat().st_size > 10000:
        return
    print(f"Fetching {target.name}", flush=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "ASRI-Tutorial/1.0"}), timeout=180) as response, target.open("wb") as file:
        while part := response.read(1024 * 1024):
            file.write(part)
    if target.stat().st_size < 1000:
        raise RuntimeError(f"Voice download failed: {target}")


def srttime(seconds: float) -> str:
    ms = round(seconds * 1000)
    h, remainder = divmod(ms, 3600000)
    m, remainder = divmod(remainder, 60000)
    s, millis = divmod(remainder, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{millis:03d}"


def asstime(seconds: float) -> str:
    cs = round(seconds * 100)
    h, remainder = divmod(cs, 360000)
    m, remainder = divmod(remainder, 6000)
    s, c = divmod(remainder, 100)
    return f"{h}:{m:02d}:{s:02d}.{c:02d}"


def wrap_caption(text: str) -> str:
    lines = textwrap.wrap(text, width=CAPTION_WRAP, break_long_words=False, break_on_hyphens=False)
    if len(lines) > 2:
        raise ValueError(f"Caption exceeds the two-line maximum: {text}")
    return "\\N".join(x.replace("{", "(").replace("}", ")") for x in lines)


def main() -> None:
    data = json.loads((ROOT / "chapters.json").read_text(encoding="utf-8"))
    all_cues = [cue for chapter in data["chapters"] for cue in chapter["cues"]]
    ids = [cue["id"] for cue in all_cues]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Cue IDs are not unique")
    model = VOICE / (MODEL_NAME + ".onnx")
    cfg = VOICE / (MODEL_NAME + ".onnx.json")
    download(VOICE_BASE + model.name + "?download=true", model)
    download(VOICE_BASE + cfg.name + "?download=true", cfg)

    # Generate cue by cue to get exact spoken timings rather than estimating
    # the position of words in a synthetic paragraph.
    clips = {}
    audio_spec = None
    for n, cue in enumerate(all_cues, 1):
        print(f"Narration cue {n}/{len(all_cues)}: {cue['id']}", flush=True)
        wav_path = OUT / f"segment-{n:03d}.wav"
        subprocess.run(
            ["piper", "--model", str(model), "--config", str(cfg),
             "--output_file", str(wav_path)],
            input=cue["text"].encode("utf-8"), check=True,
        )
        with wave.open(str(wav_path), "rb") as f:
            spec = (f.getframerate(), f.getnchannels(), f.getsampwidth())
            if audio_spec is None:
                audio_spec = spec
            elif audio_spec != spec:
                raise RuntimeError("Inconsistent speech segments")
            clips[cue["id"]] = (f.readframes(f.getnframes()), f.getnframes() / spec[0])

    assert audio_spec
    sample_rate, channels, width = audio_spec
    zero = bytes(channels * width)
    def silence(seconds: float) -> bytes:
        return zero * round(seconds * sample_rate)

    subtitles = []
    ass_events = []
    chapters_timed = []
    second = LEAD
    caption_number = 0
    with wave.open(str(OUT / "narration.wav"), "wb") as joined:
        joined.setframerate(sample_rate)
        joined.setnchannels(channels)
        joined.setsampwidth(width)
        joined.writeframes(silence(LEAD))

        for chapter in data["chapters"]:
            cstart = second
            cues_timed = []
            for i, cue in enumerate(chapter["cues"]):
                frames, length = clips[cue["id"]]
                start = second
                end = start + length
                joined.writeframes(frames)
                # Split long Spanish narration into shorter subtitle cards.
                # Keep each card at most two short lines and outside the UI.
                # Audio and on-screen actions retain their per-cue synchronization.
                lines = textwrap.wrap(cue["text"], width=CAPTION_WRAP,
                                      break_long_words=False, break_on_hyphens=False)
                groups = [" ".join(lines[k:k+2]) for k in range(0, len(lines), 2)]
                weights = [len(part) for part in groups]
                total_weight = sum(weights)
                caption_start = start
                for k, part in enumerate(groups):
                    caption_end = end if k == len(groups) - 1 else (
                        caption_start + length * weights[k] / total_weight
                    )
                    formatted = wrap_caption(part)
                    caption_number += 1
                    subtitles.append(
                        f"{caption_number}\n{srttime(caption_start)} --> {srttime(caption_end)}\n"
                        f"{formatted.replace(chr(92) + 'N', chr(10))}\n"
                    )
                    ass_events.append(
                        f"Dialogue: 0,{asstime(caption_start)},{asstime(caption_end)},Captions,,0,0,0,,{formatted}"
                    )
                    caption_start = caption_end
                gap = CHAPTER_PAUSE if i == len(chapter["cues"]) - 1 else CUE_PAUSE
                joined.writeframes(silence(gap))
                cues_timed.append({
                    **cue,
                    "start_seconds": round(start, 3),
                    "voice_seconds": round(length, 3),
                    "hold_seconds": round(length + gap, 3),
                })
                second = end + gap
            chapters_timed.append({
                "id": chapter["id"], "title": chapter["title"],
                "start_seconds": round(cstart, 3),
                "hold_seconds": round(second - cstart, 3),
                "cues": cues_timed,
            })
        joined.writeframes(silence(TAIL))

    manifest = {
        "title": "Strategic Resilience Intelligence — Tutorial completo en castellano",
        "language": "es-ES",
        "voice": MODEL_NAME,
        "voice_credit": "Piper es_ES-davefx-medium, OHF-Voice dataset CC0",
        "lead_seconds": LEAD,
        "cue_pause_seconds": CUE_PAUSE,
        "chapter_pause_seconds": CHAPTER_PAUSE,
        "tail_seconds": TAIL,
        "chapters": chapters_timed,
        "duration_seconds": round(second + TAIL, 3),
        "caption_max_lines": 2,
        "captions_outside_app": True,
    }
    (OUT / "timeline.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (OUT / "subtitles.srt").write_text("\n".join(subtitles), encoding="utf-8")
    # PlayRes values precisely match output video. The 110px bottom caption
    # bar is OUTSIDE the 970px screen recording, so captions cannot obscure UI.
    ass_header = """[Script Info]
Title: ASRI Subtítulos en castellano — franja inferior
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Captions,DejaVu Sans,33,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1.4,0,2,170,170,17,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    (OUT / "captions.ass").write_text(ass_header + "\n".join(ass_events) + "\n", encoding="utf-8")
    (OUT / "voice-credits.txt").write_text(
        "Piper TTS — voz en castellano de España: es_ES-davefx-medium.\n"
        "Conjunto de entrenamiento OHF-Voice voice-datasets: CC0.\n"
        "https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium\n"
        "El caso DEMO-60 es una simulación; no contiene resultados operativos reales de Airbus.\n",
        encoding="utf-8",
    )
    print(f"TUTORIAL SCRIPT: {len(data['chapters'])} chapters; {len(all_cues)} spoken cues.", flush=True)
    print(f"TUTORIAL NARRATION: {manifest['duration_seconds']:.2f} seconds.", flush=True)


if __name__ == "__main__":
    main()
