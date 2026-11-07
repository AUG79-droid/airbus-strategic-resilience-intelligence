#!/usr/bin/env python3
"""Assemble validated real-browser recording, local British TTS and subtitles."""
from __future__ import annotations
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
VOICE = OUT / "narration.wav"
VIDEO = OUT / "browser.webm"
DEST = OUT / "ASRI_English_Demo_60s.mp4"

def probe(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())

def main() -> None:
    for file in [VOICE, VIDEO, OUT / "subtitles.srt", OUT / "recording-timing.json"]:
        if not file.is_file() or file.stat().st_size < 100:
            raise RuntimeError(f"Required input is absent or empty: {file}")
    audio_seconds = probe(VOICE)
    video_seconds = probe(VIDEO)
    manifest = json.loads((OUT / "timeline.json").read_text(encoding="utf-8"))
    recording = json.loads((OUT / "recording-timing.json").read_text(encoding="utf-8"))
    if abs(audio_seconds - manifest["duration_seconds"]) > 0.5:
        raise RuntimeError("Narration differs from the declared scene timeline.")
    if abs(recording["browser_seconds"] - audio_seconds) > 2.5:
        raise RuntimeError("Visual actions took substantially longer than narration.")
    if video_seconds < audio_seconds - 2:
        raise RuntimeError(f"Browser recording too short: {video_seconds} < {audio_seconds}")

    # Playwright recording begins during page navigation; trim that initial pre-roll.
    # Video recording finalisation may add a fraction of a second at the end.
    preroll = max(0.0, video_seconds - audio_seconds)
    print(f"Audio: {audio_seconds:.2f}s | raw browser: {video_seconds:.2f}s | trim pre-roll: {preroll:.2f}s", flush=True)
    vf = (
        "scale=1920:1080:flags=lanczos,"
        "tpad=stop_mode=clone:stop_duration=3,"
        "subtitles=subtitles.srt:force_style="
        "'FontName=DejaVu Sans,FontSize=18,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H80000000,BorderStyle=1,Outline=2,Shadow=1,MarginV=38'"
    )
    command = [
        "ffmpeg", "-hide_banner", "-nostdin", "-y",
        "-ss", f"{preroll:.3f}", "-i", str(VIDEO.resolve()),
        "-i", str(VOICE.resolve()), "-t", f"{audio_seconds:.3f}",
        "-map", "0:v:0", "-map", "1:a:0",
        "-vf", vf, "-r", "25",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        "-metadata", "title=Strategic Resilience Intelligence - guided preview",
        "-metadata", "comment=Fictional demo. Voice: Piper en_GB-alba-medium, dataset CC BY 4.0; attribution supplied.",
        str(DEST.resolve()),
    ]
    subprocess.run(command, cwd=OUT, check=True)
    final = probe(DEST)
    if not 35 < final < 130:
        raise RuntimeError(f"Unexpected output duration: {final:.2f}s")
    if DEST.stat().st_size < 1_000_000:
        raise RuntimeError("Output MP4 is suspiciously small.")
    print(f"SUCCESS: {DEST} ({final:.2f}s, {DEST.stat().st_size // 1_000_000} MB)", flush=True)
    report = {
        "video_file": DEST.name,
        "duration_seconds": round(final, 2),
        "resolution": "1920x1080",
        "voice": manifest["voice"],
        "fictional_case": True,
        "recorded_app": recording["url"],
        "verified_scenario": recording["verified"],
        "browser_errors": recording["page_errors"],
        "licence": "Voice attribution in voice-credits.txt",
    }
    (OUT / "video-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
