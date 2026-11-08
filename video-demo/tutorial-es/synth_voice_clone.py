#!/usr/bin/env python3
"""Synthesise one shard of the 82 approved ASRI Spanish narration cues.

The voice reference is the exact SYNTHETIC (not a real person) sample approved
by the user, downloaded from a previous run in the same public GitHub repo.
This is a checkpointed, no-paid-API workflow. No app or English video edits.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
import wave
from pathlib import Path
from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
OUT.mkdir(parents=True, exist_ok=True)
REFERENCE = ROOT / "reference" / "ASRI_Locutor_Sereno_Castellano.mp3"
SCRIPT = ROOT / "chapters.json"

REFERENCE_TEXT = (
    "Bienvenidos a la herramienta de inteligencia para la resiliencia estratégica. "
    "Imaginemos que un módulo electrónico de control ha dejado de funcionar. "
    "Tenemos sesenta días para recuperarlo. "
    "Podemos sustituirlo, repararlo o trabajar en paralelo por las dos vías. "
    "El objetivo es comprender qué alternativa reduce la exposición al riesgo, "
    "sin perder de vista los costes ni las evidencias disponibles."
)

def args():
    p = argparse.ArgumentParser()
    p.add_argument("--shard", type=int, required=True)
    p.add_argument("--shards", type=int, default=4)
    return p.parse_args()

def main():
    a = args()
    if a.shards < 1 or not (0 <= a.shard < a.shards):
        raise ValueError("Invalid shard number")
    data = json.loads(SCRIPT.read_text(encoding="utf-8"))
    if data["language"] != "es-ES":
        raise RuntimeError("This pipeline requires the Castilian Spanish script")
    cues = [c for ch in data["chapters"] for c in ch["cues"]]
    if len(cues) != 82:
        raise RuntimeError("Expected exactly 82 narration cues")
    if not REFERENCE.is_file() or REFERENCE.stat().st_size < 100_000:
        raise RuntimeError("The exact approved synthetic narrator reference is missing")
    # Gradio client downloads returned Gradio Audio files to the runner.
    client = Client("Qwen/Qwen3-TTS")
    done = 0
    for i, cue in enumerate(cues, start=1):
        if (i - 1) % a.shards != a.shard:
            continue
        wav = OUT / f"segment-{i:03d}.wav"
        if wav.is_file() and wav.stat().st_size > 15_000:
            done += 1
            continue
        print(f"Shard {a.shard}/{a.shards}, cue {i}/{len(cues)}: {cue['id']}", flush=True)
        text = cue["text"].strip()
        if not text or re.search(r"\b(?:Strategic Resilience Intelligence|JSON|PDF|Check|Challenge)\b", text, re.I):
            raise RuntimeError(f"Invalid/English spoken cue: {i}")
        for attempt in range(1, 6):
            try:
                result = client.predict(
                    handle_file(str(REFERENCE.resolve())),
                    REFERENCE_TEXT,
                    text,
                    "Spanish",
                    False,  # Full in-context speaker and pronunciation, NOT x-vector-only.
                    "1.7B", # Same model used in the successful speaker identity probe.
                    api_name="/generate_voice_clone",
                )
                source = result[0] if isinstance(result, (list, tuple)) else result
                status = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else ""
                if isinstance(source, dict):
                    source = source.get("path") or source.get("url")
                if not isinstance(source, str) or not Path(source).is_file() or "Error" in str(status):
                    raise RuntimeError(f"Voice service did not return audio: {str(status)[:200]}")
                subprocess.run([
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(source), "-ar", "24000", "-ac", "1",
                    "-c:a", "pcm_s16le", str(wav),
                ], check=True)
                with wave.open(str(wav), "rb") as f:
                    duration = f.getnframes() / f.getframerate()
                    if f.getframerate() != 24000 or f.getnchannels() != 1:
                        raise RuntimeError("Incorrect TTS audio sample rate")
                    if not (1.25 < duration < 40):
                        raise RuntimeError(f"Speech duration is implausible: {duration:.1f}s")
                print(f"  OK: {wav.name} {duration:.2f}s", flush=True)
                done += 1
                break
            except Exception as exc:
                if wav.exists():
                    wav.unlink()
                print(f"  Attempt {attempt} failed: {type(exc).__name__}: {str(exc)[:450]}", flush=True)
                if attempt == 5:
                    raise
                time.sleep(min(12 * attempt, 48))
    expected = sum(1 for k in range(len(cues)) if k % a.shards == a.shard)
    if done != expected:
        raise RuntimeError(f"Incomplete shard: only {done}/{expected} cues")
    print(f"SHARD {a.shard} COMPLETE: {done}/{expected} approved-voice cues", flush=True)

if __name__ == "__main__":
    main()
