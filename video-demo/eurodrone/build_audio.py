#!/usr/bin/env python3
"""Render the EXACT previously used narration engines/voice identities for Eurodrone.

English: Piper en_GB-alba-medium (same source, same voice as English tutorial).
Spanish: timing/speech stitching of the original user-approved synthetic newsreader.
The Eurodrone chapter text is new; no previous DEMO-60 voice track is reused.
"""
from __future__ import annotations
import importlib.util
import json
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
if len(sys.argv)!=2 or sys.argv[1] not in ('en','es'):
    raise SystemExit('Usage: build_audio.py en|es')
lang=sys.argv[1]
destination=HERE/lang
source=(ROOT/'tutorial'/'narrate.py') if lang=='en' else (ROOT/'tutorial-es'/'stitch_narration.py')
spec=importlib.util.spec_from_file_location('asri_previous_voice_engine',source)
mod=importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)
mod.ROOT=destination
# Give the calm British narrator a little more room between sentences
# and more visual reading time at chapter transitions.
if lang=='en':
    mod.CUE_PAUSE=1.25
    mod.CHAPTER_PAUSE=2.6
    mod.LEAD=1.5
    mod.TAIL=3.0
mod.OUT=destination/'output'
mod.VOICE=destination/'_voice'
mod.OUT.mkdir(parents=True,exist_ok=True)
mod.VOICE.mkdir(parents=True,exist_ok=True)
mod.main()
timeline_path=mod.OUT/'timeline.json'
data=json.loads(timeline_path.read_text(encoding='utf-8'))
data['title']='ASRI 2.0 — Eurodrone | Full British English Tutorial'
data['case']='Eurodrone hypothetical eco-design and supply resilience, not Airbus performance'
data['voice_inherited_from_original_tutorial']=True
timeline_path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
credits=mod.OUT/'voice-credits.txt'
raw=credits.read_text(encoding='utf-8')
raw=raw.replace('The fictional DEMO-60 scenario is not Airbus operational performance data.',
  'The fictional Eurodrone study is not Airbus operational performance data.')
raw=raw.replace('Escenario didáctico DEMO-60; no son resultados operativos reales de Airbus.',
  'Ejercicio hipotético de Eurodrone; no son resultados operativos reales de Airbus.')
credits.write_text(raw,encoding='utf-8')
print('EURODRONE AUDIO COMPLETE:',lang,data['duration_seconds'],'seconds;',sum(len(c['cues']) for c in data['chapters']),'cues',flush=True)
