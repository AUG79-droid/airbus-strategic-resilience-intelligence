#!/usr/bin/env python3
"""One calm, Castilian Spanish newsreader voice sample. No real-person voice cloning.

Uses the openly accessible Qwen3-TTS Hugging Face Gradio Space, which hosts
the open Qwen VoiceDesign model. Only a fictional public demo paragraph is sent.
No paid API keys or secrets are used. Does not alter the web application.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from gradio_client import Client

BASE = Path(__file__).resolve().parent
OUT = BASE / "newsreader-preview"
OUT.mkdir(exist_ok=True, parents=True)

TEXT = (
    "Bienvenidos a la herramienta de inteligencia para la resiliencia estratégica. "
    "Imaginemos que un módulo electrónico de control ha dejado de funcionar. "
    "Tenemos sesenta días para recuperarlo. "
    "Podemos sustituirlo, repararlo o trabajar en paralelo por las dos vías. "
    "El objetivo es comprender qué alternativa reduce la exposición al riesgo, "
    "sin perder de vista los costes ni las evidencias disponibles."
)

INSTRUCT = (
    "A professional mature male television newsreader from Spain. "
    "Native standard Castilian Spanish (Spain), never Latin American Spanish. "
    "Low, rounded baritone voice, rich natural resonance, warm but dignified. "
    "Calm, deeply reassuring, composed, unhurried delivery, no tension or urgency. "
    "Impeccably clear articulation and intelligible consonants. "
    "Natural measured pauses at full stops and commas. "
    "Strictly neutral, trustworthy informative delivery like a seasoned "
    "public-service television documentary narrator. "
    "NO shouting, NO excitement, NO exaggerated gravitas, NO stage acting, "
    "NO aggressive announcer voice, NO theatrical trailer delivery. "
    "Relaxed breath support and gentle sentence endings."
)

print("Connecting to official free Qwen3 TTS demonstration Space", flush=True)
client = Client("Qwen/Qwen3-TTS")
print("Generating single, low-intensity Spain-Spanish voice preview", flush=True)
try:
    result = client.predict(TEXT, "Spanish", INSTRUCT, api_name="/generate_voice_design")
except Exception:
    # Gradio versions sometimes assign function-specific numbered names. Print
    # the advertised API to make an integration failure diagnosable.
    try:
        print(client.view_api(), flush=True)
    except Exception:
        pass
    raise

audio = result[0] if isinstance(result, (list, tuple)) else result
status = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else "ok"
print("Server response:", str(status)[:350], flush=True)
if isinstance(audio, dict):
    audio = audio.get("path") or audio.get("url")
if not isinstance(audio, str) or not Path(audio).is_file():
    raise RuntimeError(f"Voice service did not deliver a usable audio file; result type: {type(audio)}")

source = Path(audio)
wav = OUT / "ASRI_Locutor_Sereno_Castellano.wav"
subprocess.run(
    ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
     "-ar", "24000", "-ac", "1", str(wav)], check=True
)
mp3 = OUT / "ASRI_Locutor_Sereno_Castellano.mp3"
subprocess.run(
    ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
     "-c:a", "libmp3lame", "-b:a", "160k", str(mp3)], check=True
)
if wav.stat().st_size < 100_000 or mp3.stat().st_size < 25_000:
    raise RuntimeError("The generated speech sample is unexpectedly short")
(OUT / "Guion_de_la_prueba.txt").write_text(TEXT + "\n\nINDICACIONES DE VOZ:\n" + INSTRUCT + "\n", encoding="utf-8")
(OUT / "AVISO.txt").write_text(
    "Voz sintética original diseñada mediante descripción; no es la voz de ningún actor real.\n"
    "Se utiliza el modelo Qwen3-TTS y una prueba externa pública de Hugging Face.\n"
    "Antes de distribuir comercialmente el vídeo definitivo hay que revisar las condiciones aplicables.\n",
    encoding="utf-8"
)
print(json.dumps({"status":"ok","wav_bytes":wav.stat().st_size,"mp3_bytes":mp3.stat().st_size,
                  "file":mp3.name}, ensure_ascii=False), flush=True)
