#!/usr/bin/env python3
"""Synthesize Eurodrone Spanish speech using the EXACT original synthetic newsreader.

Engine: qwen_tts C 1.7B base, same reference, temperature, seed and voice identity.
The original approved synthetic speaker sample is downloaded from the previous run.
No real person's likeness or recording is requested.
"""
from __future__ import annotations
import argparse
import json
import subprocess
import wave
from pathlib import Path

ROOT=Path(__file__).resolve().parent/'es'
OUT=ROOT/'output'
REF=ROOT/'reference'/'ASRI_Locutor_Sereno_Castellano.mp3'
SPEAKER_WAV=ROOT/'approved_synthetic_speaker.wav'
ENGINE=Path('/tmp/qwen-c/qwen_tts')
MODEL=Path('/tmp/qwen-c/qwen3-tts-1.7b-base')
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--shard',type=int,required=True)
    parser.add_argument('--shards',type=int,default=4)
    args=parser.parse_args()
    if not 0<=args.shard<args.shards:raise ValueError('Invalid shard')
    data=json.loads((ROOT/'chapters.json').read_text(encoding='utf-8'))
    cues=[cue for ch in data['chapters'] for cue in ch['cues']]
    if data['language']!='es-ES' or len(cues)<25:raise RuntimeError('Expected complete Spanish script')
    if not REF.is_file() or REF.stat().st_size<100000:raise RuntimeError('Approved reference voice missing')
    if not ENGINE.is_file() or not (MODEL/'model.safetensors').is_file():raise RuntimeError('Qwen engine/model not installed')
    OUT.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(REF),
       '-ar','24000','-ac','1','-c:a','pcm_s16le',str(SPEAKER_WAV)],check=True)
    done=0
    for n,cue in enumerate(cues,1):
        if (n-1)%args.shards!=args.shard:continue
        filename=OUT/f'segment-{n:03d}.wav'
        print(f'EURODRONE Spanish voice {args.shard}: {n}/{len(cues)} {cue["id"]}',flush=True)
        subprocess.run([str(ENGINE),'-d',str(MODEL),'--ref-audio',str(SPEAKER_WAV),
             '-l','Spanish','--int8','-j4','--temperature','0.45',
             '--seed','42','--max-duration','45','--text',cue['text'],'-o',str(filename)],
             check=True,timeout=420)
        with wave.open(str(filename),'rb') as f:
            spec=(f.getframerate(),f.getnchannels(),f.getsampwidth())
            seconds=f.getnframes()/f.getframerate()
        if spec!=(24000,1,2) or not 1<seconds<45:raise RuntimeError(f'Invalid wav {filename}: {spec}/{seconds}')
        print(f'  OK {filename.name}: {seconds:.2f}s',flush=True)
        done+=1
    expected=sum((n-1)%args.shards==args.shard for n in range(1,len(cues)+1))
    if done!=expected:raise RuntimeError('Incomplete shard')
    print('VOICE SHARD COMPLETE:',args.shard,done,flush=True)
if __name__=='__main__':main()
