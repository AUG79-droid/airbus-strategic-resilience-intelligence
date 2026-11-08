#!/usr/bin/env python3
"""Check the exact approved synthetic newsreader reference can be reused by Qwen3-TTS Base.
The reference is a generated voice, not a recording of any real person.
"""
from pathlib import Path
import subprocess
from gradio_client import Client, handle_file

ROOT=Path(__file__).resolve().parent
AUDIO=ROOT/"reference"/"ASRI_Locutor_Sereno_Castellano.mp3"
OUT=ROOT/"clone-probe"
OUT.mkdir(parents=True,exist_ok=True)
if not AUDIO.is_file() or AUDIO.stat().st_size<100_000:
    raise RuntimeError("Approved synthetic speaker reference missing")

REF_TEXT=(
    "Bienvenidos a la herramienta de inteligencia para la resiliencia estratégica. "
    "Imaginemos que un módulo electrónico de control ha dejado de funcionar. "
    "Tenemos sesenta días para recuperarlo. "
    "Podemos sustituirlo, repararlo o trabajar en paralelo por las dos vías. "
    "El objetivo es comprender qué alternativa reduce la exposición al riesgo, "
    "sin perder de vista los costes ni las evidencias disponibles."
)
TARGET=(
    "En esta sección comparamos las tres estrategias de recuperación. "
    "Primero analizamos la sustitución. Después examinamos la reparación "
    "y, por último, las dos vías en paralelo. "
    "Cada alternativa tiene sus propios riesgos y compromisos económicos."
)
print("Connecting to free Qwen voice cloning demonstration",flush=True)
client=Client("Qwen/Qwen3-TTS")
print("Reference:",AUDIO,AUDIO.stat().st_size,"bytes",flush=True)
result=client.predict(handle_file(str(AUDIO.resolve())),REF_TEXT,TARGET,
                      "Spanish",False,"1.7B",api_name="/generate_voice_clone")
audio=result[0] if isinstance(result,(tuple,list)) else result
status=result[1] if isinstance(result,(tuple,list)) and len(result)>1 else "ok"
print("Model response:",status,flush=True)
if isinstance(audio,dict): audio=audio.get("path") or audio.get("url")
if not isinstance(audio,str) or not Path(audio).is_file():
    raise RuntimeError("No voice audio returned: "+str(result)[:200])
mp3=OUT/"ASRI_Misma_Voz_Locutor_Prueba.mp3"
subprocess.run(["ffmpeg","-hide_banner","-v","error","-y","-i",audio,
    "-c:a","libmp3lame","-q:a","3",str(mp3)],check=True)
assert mp3.stat().st_size>15000
print("CLONE TEST SUCCESS:",mp3,mp3.stat().st_size,flush=True)
