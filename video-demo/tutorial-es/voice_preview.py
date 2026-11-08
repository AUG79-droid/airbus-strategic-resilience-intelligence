#!/usr/bin/env python3
"""Generate short, fully local samples of Kokoro's Spanish voices.

No application source changes, paid speech service, nor ChatGPT credit usage.
The final full tutorial will only be rendered after a suitable voice is heard.
"""
from pathlib import Path
import subprocess
import urllib.request

import soundfile as sf
from misaki.espeak import EspeakG2P
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "_voice_kokoro"
OUT = ROOT / "voice-previews"
MODELS.mkdir(exist_ok=True, parents=True)
OUT.mkdir(exist_ok=True, parents=True)
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/"
MODEL = MODELS / "kokoro-v1.0.onnx"
VOICES = MODELS / "voices-v1.0.bin"

def download(name: str, path: Path, min_bytes: int):
    if path.is_file() and path.stat().st_size > min_bytes:
        return
    req = urllib.request.Request(BASE + name, headers={"User-Agent":"ASRI-VoicePreview/1.0"})
    print("Downloading", name, flush=True)
    with urllib.request.urlopen(req, timeout=180) as src, path.open("wb") as dest:
        while block := src.read(1024 * 1024):
            dest.write(block)
    if path.stat().st_size <= min_bytes:
        raise RuntimeError("Incomplete voice model download: " + name)

download(MODEL.name, MODEL, 100_000_000)
download(VOICES.name, VOICES, 10_000_000)

# Spain-style Spanish grapheme-to-phoneme mapping (not Spanish-American es-419).
g2p = EspeakG2P(language="es")
tts = Kokoro(str(MODEL), str(VOICES))
text = (
    "Bienvenidos a la herramienta de inteligencia para la resiliencia estratégica. "
    "En este ejemplo, un módulo electrónico ha dejado de funcionar. "
    "Nuestro objetivo es recuperar su operatividad y comparar tres alternativas. "
    "Al aumentar la viabilidad de reparación del setenta y cinco al noventa por ciento, "
    "el tiempo medio de recuperación baja de cincuenta a treinta y seis coma ocho días."
)
phonemes, _ = g2p(text)
if not phonemes:
    raise RuntimeError("Spanish phonetic transcription is empty")

for voice in ("em_alex", "em_santa", "ef_dora"):
    print("Creating preview:", voice, flush=True)
    audio, rate = tts.create(phonemes, voice=voice, speed=0.96, is_phonemes=True)
    wav = OUT / f"ASRI_prueba_voz_{voice}.wav"
    sf.write(wav, audio, rate)
    if wav.stat().st_size < 20_000:
        raise RuntimeError("Unexpectedly short speech sample: " + wav.name)
    mp3 = OUT / f"ASRI_prueba_voz_{voice}.mp3"
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(wav), "-c:a", "libmp3lame", "-q:a", "3", str(mp3)
    ], check=True)
    print(f"OK: {mp3.name} ({mp3.stat().st_size:,} bytes)", flush=True)
(OUT / "guion-prueba.txt").write_text(text + "\n", encoding="utf-8")
(OUT / "credits.txt").write_text(
    "Kokoro-82M — model Apache-2.0; samples generated on GitHub Actions.\n"
    "Voices: em_alex, em_santa, ef_dora. No paid synthesis APIs.\n"
    "Spanish phonemisation: espeak-ng, language es. Listen to verify regional accent.\n",
    encoding="utf-8"
)
print("VOICE PREVIEWS COMPLETE", flush=True)
