#!/usr/bin/env python3
"""Render the approved synthetic Qwen newsreader voice WITHOUT a ZeroGPU service.

C-based local Qwen3-TTS Base 1.7B inference on GitHub's standard CPU runners.
The reference voice was synthetically designed and approved by the user;
this never clones a real person's recording. Runs independent of app/.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True, parents=True)
REFERENCE = ROOT / "reference" / "ASRI_Locutor_Sereno_Castellano.mp3"
SPEAKER_WAV = ROOT / "_approved_synthetic_narrator.wav"
ENGINE = Path("/tmp/qwen-c/qwen_tts")
MODEL = Path("/tmp/qwen-c/qwen3-tts-1.7b-base")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shard", type=int, required=True)
    parser.add_argument("--shards", type=int, default=4)
    args = parser.parse_args()
    if args.shard < 0 or args.shard >= args.shards:
        raise ValueError("Invalid shard number")
    data = json.loads((ROOT / "chapters.json").read_text(encoding="utf-8"))
    if data["language"] != "es-ES":
        raise ValueError("The script must be European Spanish")
    cues = [cue for ch in data["chapters"] for cue in ch["cues"]]
    if len(cues) != 82:
        raise RuntimeError(f"Expected 82 cues; got {len(cues)}")
    if not REFERENCE.is_file() or REFERENCE.stat().st_size < 100_000:
        raise RuntimeError("Missing exact original synthetic narrator sample")
    if not ENGINE.is_file() or not (MODEL / "model.safetensors").is_file():
        raise RuntimeError("Local Qwen engine/model were not installed")

    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(REFERENCE), "-ar", "24000", "-ac", "1",
        "-c:a", "pcm_s16le", str(SPEAKER_WAV)
    ], check=True)

    done = 0
    for n, cue in enumerate(cues, start=1):
        if (n - 1) % args.shards != args.shard:
            continue
        target = OUT / f"segment-{n:03d}.wav"
        if target.is_file() and target.stat().st_size > 15_000:
            done += 1
            continue
        print(f"CPU narrator shard {args.shard}: {n}/{len(cues)} {cue['id']}", flush=True)
        command = [
            str(ENGINE), "-d", str(MODEL),
            "--ref-audio", str(SPEAKER_WAV),
            "-l", "Spanish", "--int8", "-j4",
            "--temperature", "0.45", "--seed", "42",
            "--max-duration", "45",
            "--text", cue["text"],
            "-o", str(target)
        ]
        try:
            subprocess.run(command, check=True, timeout=420)
            with wave.open(str(target), "rb") as audio:
                rate, channels, width = audio.getframerate(), audio.getnchannels(), audio.getsampwidth()
                length = audio.getnframes() / rate
            if (rate, channels, width) != (24000, 1, 2):
                raise RuntimeError(f"Unexpected WAV format: {rate}/{channels}/{width}")
            if not 1 < length < 45:
                raise RuntimeError(f"Unexpected duration for {cue['id']}: {length}s")
            print(f"  OK {target.name}: {length:.2f}s", flush=True)
            done += 1
        except Exception:
            if target.exists():
                target.unlink()
            raise
    expected = sum((n % args.shards == args.shard) for n in range(len(cues)))
    if done != expected:
        raise RuntimeError(f"Shard incomplete: {done}/{expected}")
    print(f"CPU SHARD COMPLETE: {args.shard} ({done} voice clips)", flush=True)

if __name__ == "__main__":
    main()
