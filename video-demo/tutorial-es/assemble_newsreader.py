#!/usr/bin/env python3
"""Build a complete Spanish (Spain) narrated tutorial with captions below the interface."""
from __future__ import annotations
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
WAV = OUT / "narration.wav"
VIDEO = OUT / "browser.webm"
FINAL = OUT / "ASRI_Tutorial_Castellano_Locutor_Sereno.mp4"


def probe(file: Path) -> float:
    command = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=noprint_wrappers=1:nokey=1", str(file)]
    return float(subprocess.run(command, capture_output=True, text=True, check=True).stdout.strip())


def detect_start(file: Path) -> tuple[float, int]:
    # Read a 32px square INSIDE the temporary magenta corner marker;
    # find the exact video frame where it disappears. This is t=0 of WAV.
    command = [
        "ffmpeg", "-v", "error", "-nostdin", "-i", str(file),
        "-vf", "fps=25,crop=32:32:4:4,scale=1:1:flags=area,format=rgb24",
        "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ]
    stream = subprocess.run(command, capture_output=True, check=True).stdout
    if len(stream) % 3:
        raise RuntimeError("Invalid synchronization samples")
    hits = [
        i for i in range(len(stream)//3)
        if stream[i*3] >= 175 and stream[i*3+1] <= 95 and stream[i*3+2] >= 175
    ]
    if len(hits) < 8 or max(hits)-min(hits) > len(hits)+4:
        raise RuntimeError("Frame-level sync marker absent or inconsistent")
    offset = (max(hits)+1) / 25
    print(f"Detected sync marker: {len(hits)} video frames; start offset {offset:.3f}s",flush=True)
    return offset, len(hits)


def main() -> None:
    needed = [
        WAV, VIDEO, OUT/"timeline.json", OUT/"subtitles.srt",
        OUT/"captions.ass", OUT/"recording-timing.json",
        OUT/"example-decision-report.pdf", OUT/"example-decision-data.json",
    ]
    for file in needed:
        if not file.is_file() or file.stat().st_size < 80:
            raise RuntimeError(f"Required tutorial asset missing or empty: {file.name}")
    timeline = json.loads((OUT/"timeline.json").read_text(encoding="utf-8"))
    recording = json.loads((OUT/"recording-timing.json").read_text(encoding="utf-8"))
    audio_seconds = probe(WAV)
    video_seconds = probe(VIDEO)
    if timeline.get("language") != "es-ES" or not timeline.get("voice", "").startswith("Qwen3-TTS"):
        raise RuntimeError("Spanish voice and narration required for the ES-ES video")
    if len(timeline["chapters"]) != 7:
        raise RuntimeError("The complete narrated tutorial must cover all chapters.")
    if recording["cues"] != sum(len(ch["cues"]) for ch in timeline["chapters"]):
        raise RuntimeError("A narrated cue is missing its browser action.")
    if abs(audio_seconds-timeline["duration_seconds"]) > 0.6:
        raise RuntimeError("Narration duration does not match published timeline.")
    if abs(recording["browser_seconds"]-audio_seconds) > 2.0:
        raise RuntimeError("Captured browser actions drift from audio.")
    if recording["page_errors"]:
        print("Browser warnings:",recording["page_errors"],flush=True)
    offset,frames = detect_start(VIDEO)
    if video_seconds-offset < audio_seconds-0.7:
        raise RuntimeError("Browser video ends before narration does.")
    maximum_drift=max(abs(x["drift_ms"]) for x in recording["cue_timings"])
    if maximum_drift > 1800:
        raise RuntimeError(f"UI action and narration drift exceeds safety limit: {maximum_drift}ms")
    # UI occupies y=0..969. Subtitles live entirely in y=970..1079
    # — a separate 110px dark bar OUTSIDE the application image.
    visual_filter = (
        "fps=25,"
        "pad=1920:1080:0:0:color=0x101821,"
        "tpad=stop_mode=clone:stop_duration=2,"
        "ass=captions.ass"
    )
    print(f"VOICE {audio_seconds:.2f}s | BROWSER {video_seconds:.2f}s | OFFSET {offset:.2f}s | MAX CUE DRIFT {maximum_drift}ms",flush=True)
    cmd = [
        "ffmpeg","-hide_banner","-nostdin","-y",
        "-ss",f"{offset:.3f}","-i",str(VIDEO.resolve()),
        "-i",str(WAV.resolve()),"-t",f"{audio_seconds:.3f}",
        "-map","0:v:0","-map","1:a:0",
        "-vf",visual_filter,
        "-r","25","-c:v","libx264","-preset","veryfast","-crf","23",
        "-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","144k",
        "-movflags","+faststart",
        "-metadata","title=Strategic Resilience Intelligence | Tutorial completo en castellano de España",
        "-metadata","comment=Voz serena generada con Qwen3-TTS Base a partir de muestra sintética diseñada para la demostración; no voz real.",
        str(FINAL.resolve()),
    ]
    subprocess.run(cmd,check=True,cwd=OUT)
    duration=probe(FINAL)
    if duration<6*60 or duration>22*60:
        raise RuntimeError(f"Unexpected tutorial duration: {duration:.1f}s")
    if FINAL.stat().st_size<2_000_000:
        raise RuntimeError("Exported MP4 is unexpectedly small")
    report = {
        "status":"succeeded",
        "file":FINAL.name,
        "duration_minutes":round(duration/60,2),
        "resolution":"1920x1080",
        "language":"es-ES",
        "voice":timeline["voice"],
        "locale_verified":"es" in str(recording.get("checks", [])).lower() or "Spanish interface verified" in str(recording.get("checks", [])),
        "application_visible_area":"1920x970; no captions over application",
        "caption_area":"110-pixel band below application",
        "caption_maximum_lines":2,
        "chapters":[{"title":ch["title"],"start_seconds":ch["start_seconds"],"cues":len(ch["cues"])} for ch in timeline["chapters"]],
        "spoken_cues":recording["cues"],
        "maximum_cue_drift_ms":maximum_drift,
        "synchronized_by_video_frames":frames,
        "verified":recording["checks"],
        "fictional_case":True,
        "license":"See voice-credits.txt",
        "note":"Successful technical render, not a human review of editorial quality.",
    }
    (OUT/"tutorial-report.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print(f"TUTORIAL COMPLETE: {FINAL.name}, {duration/60:.2f} minutes; {recording['cues']} narration cues",flush=True)


if __name__ == "__main__":
    main()
