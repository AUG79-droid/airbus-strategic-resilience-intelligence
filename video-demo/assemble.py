#!/usr/bin/env python3
"""Assemble validated real-browser recording, local British TTS and subtitles."""
from __future__ import annotations
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
VOICE = OUT / "narration.wav"
VIDEO = OUT / "browser.webm"
DEST = OUT / "ASRI_English_Demo_Synced_v2.mp4"

def probe(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def detect_narration_zero(video: Path) -> tuple[float, int]:
    """Find the first clean frame after a deliberately captured magenta marker.

    Playwright begins capturing before navigation completes. Trimming to
    raw-video-duration minus audio-duration confuses end-padding with pre-roll.
    A distinct 850 ms frame marker yields precise synchronization instead.
    """
    fps = 25
    # Averages a 32x32 sample inside the temporary 96x96 magenta patch.
    command = [
        "ffmpeg", "-v", "error", "-nostdin", "-i", str(video),
        "-vf", "fps=25,crop=32:32:4:4,scale=1:1:flags=area,format=rgb24",
        "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ]
    frames = subprocess.run(command, capture_output=True, check=True).stdout
    if len(frames) % 3:
        raise RuntimeError("Invalid marker-detection raw video.")
    markers = [
        i for i in range(len(frames) // 3)
        if frames[3*i] >= 175 and frames[3*i+1] <= 95 and frames[3*i+2] >= 175
    ]
    if len(markers) < 8:
        raise RuntimeError("Video synchronization marker not found (need at least 8 frames).")
    if max(markers) - min(markers) > len(markers) + 4:
        raise RuntimeError("Unexpected split/multiple synchronization markers.")
    # The first *non*-magenta frame is the narration timeline's t = 0.
    preroll = (max(markers) + 1) / fps
    print(f"Detected {len(markers)} sync frames; precise pre-roll: {preroll:.3f}s", flush=True)
    return preroll, len(markers)

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

    preroll, marker_frames = detect_narration_zero(VIDEO)
    if video_seconds - preroll < audio_seconds - 0.55:
        raise RuntimeError("Browser recording is shorter than the synchronized audio.")
    if any(abs(cue["drift_ms"]) > 500 for cue in recording["cue_timings"]):
        raise RuntimeError("A visual cue deviated too far from its spoken sentence.")
    print(f"Audio: {audio_seconds:.2f}s | raw browser: {video_seconds:.2f}s | precise video offset: {preroll:.2f}s", flush=True)
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
        "sync_method": "Visual marker detected in recorded video",
        "video_preroll_seconds": round(preroll, 3),
        "marker_frames_found": marker_frames,
        "maximum_cue_drift_ms": max(abs(c["drift_ms"]) for c in recording["cue_timings"]),
    }
    (OUT / "video-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
