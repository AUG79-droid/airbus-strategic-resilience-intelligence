#!/usr/bin/env python3
"""Assemble verified Eurodrone tutorials, with matching English/Spanish narrators.

Frame-synchronised output: 1920x970 real app + 110-pixel caption strip below.
Caption font, speaker setup, cursor and editing style follow original tutorials.
"""
from __future__ import annotations
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
VIDEO_DEMO=HERE.parent
if len(sys.argv)!=2 or sys.argv[1] not in ('en','es'):
    raise SystemExit('Usage: render_video.py en|es')
lang=sys.argv[1]
root=HERE/lang
out=root/'output'
wav=out/'narration.wav'
webm=out/'browser.webm'
filename='ASRI_Eurodrone_Tutorial_English.mp4' if lang=='en' else 'ASRI_Eurodrone_Tutorial_Castellano_Locutor_Sereno.mp4'
final=out/filename
old=VIDEO_DEMO/'tutorial'/'assemble.py'
spec=importlib.util.spec_from_file_location('asri_previous_video_assembly',old)
mod=importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(mod)
for f in [wav,webm,out/'timeline.json',out/'subtitles.srt',
          out/'captions.ass',out/'recording-timing.json',
          out/'eurodrone-report.pdf',out/'eurodrone-report.md',out/'eurodrone-case.json']:
    if not f.is_file() or f.stat().st_size<100:
        raise RuntimeError('Missing required recording or export: '+str(f))
timeline=json.loads((out/'timeline.json').read_text(encoding='utf-8'))
recording=json.loads((out/'recording-timing.json').read_text(encoding='utf-8'))
expected=sum(len(c['cues']) for c in timeline['chapters'])
if len(timeline['chapters'])!=7 or expected<85 or sum(len(ch['cues']) for ch in timeline['chapters'] if ch['id']=='translate')<40 or recording['cues']!=expected:
    raise RuntimeError(f'Incomplete tutorial. {len(timeline["chapters"])} chapters, {expected} cues, {recording["cues"]} recorded')
if lang=='es' and not timeline['voice'].startswith('Qwen3-TTS'):
    raise RuntimeError('Spanish newsreader narrator was not preserved')
if lang=='en' and timeline['voice']!='en_GB-alba-medium':
    raise RuntimeError('The original British English voice was not preserved')
for phrase in ('Eurodrone synthetic case loaded','Fictional input changed live comparison',
               'All 18 prepared fictional evidence records loaded without creating pending records',
               'Both comparisons show completed simulated exercise with no missing evidence',
               'Translate shows seven in-depth conclusions and complete exercise status, no pending checklist',
               'Translate recalculated to repair plus alternative supplier',
               'eurodrone-report.pdf downloaded','eurodrone-case.json downloaded'):
    if phrase not in recording['checks']:
        raise RuntimeError('Missing required interactive check: '+phrase)
if recording['page_errors']:
    print('Browser warnings:',recording['page_errors'])
audio=mod.probe(wav)
video=mod.probe(webm)
if abs(audio-timeline['duration_seconds'])>.6 or abs(recording['browser_seconds']-audio)>2:
    raise RuntimeError(f'Timing mismatch: wav {audio}, browser {recording["browser_seconds"]}, timeline {timeline["duration_seconds"]}')
offset,marker_frames=mod.detect_start(webm)
if video-offset<audio-.8:
    raise RuntimeError('Recorded video too short')
max_drift=max(abs(c['drift_ms']) for c in recording['cue_timings'])
if max_drift>1900:
    raise RuntimeError('Narration/browser sync drift: '+str(max_drift))
filter='fps=25,pad=1920:1080:0:0:color=0x101821,tpad=stop_mode=clone:stop_duration=2,ass=captions.ass'
label='Eurodrone | Expanded Strategic Translate | British English' if lang=='en' else 'Eurodrone | Caso Estratégico Completo | Castellano'
subprocess.run([
    'ffmpeg','-hide_banner','-nostdin','-y',
    '-ss',f'{offset:.3f}','-i',str(webm.resolve()),
    '-i',str(wav.resolve()),'-t',f'{audio:.3f}',
    '-map','0:v:0','-map','1:a:0','-vf',filter,
    '-r','25','-c:v','libx264','-preset','veryfast','-crf','23',
    '-pix_fmt','yuv420p','-c:a','aac','-b:a','144k','-movflags','+faststart',
    '-metadata','title='+label,
    '-metadata','comment=Hypothetical Eurodrone scenario, not Airbus programme data; evidence claims unvalidated',
    str(final.resolve())
],check=True,cwd=out)
duration=mod.probe(final)
if not 150<duration<1400 or final.stat().st_size<2_000_000:
    raise RuntimeError('Final video has invalid duration or filesize')
result={
    'status':'succeeded','file':filename,'language':timeline['language'],
    'duration_seconds':round(duration,2),'duration_minutes':round(duration/60,2),
    'narrator':timeline['voice'],'identical_narrator_model_to_original':True,
    'chapters':[{'id':ch['id'],'title':ch['title'],'cues':len(ch['cues'])} for ch in timeline['chapters']],
    'spoken_cues':expected,'maximum_cue_drift_ms':max_drift,
    'resolution':'1920x1080','visible_app_area':'1920x970',
    'captions':'two-line maximum, separate 110-pixel lower band',
    'fictional_case':True,'checks':recording['checks'],
    'strategic_translation_cues':sum(len(ch['cues']) for ch in timeline['chapters'] if ch['id']=='translate'),
    'translate_in_depth_conclusions':7,
    'audio_video_synchronized_by_marker_frames':marker_frames,
    'note':'Technical render verified. Does not claim independent review of programme-specific figures.'
}
(out/'tutorial-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('EURODRONE VIDEO COMPLETE',lang,filename,round(duration/60,2),'minutes',expected,'cues','max drift',max_drift,'ms',flush=True)
