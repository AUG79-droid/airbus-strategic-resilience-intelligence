# ASRI guided video preview

This independent folder **does not modify the web application**. It records the published
[Airbus Strategic Resilience Intelligence](https://aug79-droid.github.io/airbus-strategic-resilience-intelligence/)
site in an automated, sandboxed Chromium browser.

## Video contents

- ASRI_English_Demo_60s.mp4 — Full HD, English narration, English captions.
- subtitles.srt — editable captions.
- voice-credits.txt — Piper voice attribution and licence.
- timeline.json and video-report.json — timing and checks.
- scene-start.png and scene-change.png — review images.

The 60-second preview opens the fictional case, chooses Repair First,
shows 50 days average recovery, opens the analysis, changes repair feasibility
from 75% to 90% to obtain 36.8 days, then opens the calculation details.
The recording stops with an error if the web interface does not produce
these results.

## How to run

Open [the video workflow](https://github.com/AUG79-droid/airbus-strategic-resilience-intelligence/actions/workflows/video-demo.yml),
choose Run workflow, and download the ASRI-English-Video-Preview ZIP from
Artifacts under the completed run. Extract the MP4.

An initial run can also be started by committing the one-time trigger file
video-demo/TRIGGER_ONCE.txt. Other source-file changes do not start a video job.

## Cost and privacy

This uses only a standard GitHub-hosted runner in a public repository,
currently free under GitHub's public repository Actions policy. No ChatGPT
Work, Codex, HeyGen or paid voice/video-generation credits. The work runs
on GitHub's temporary computer, not the user's Windows desktop.

Playwright Core is pinned in a separate package.json, Piper TTS synthesises
audio locally, and FFmpeg encodes the output. Runtime downloads and output
files stay on the temporary runner, except for the downloadable result.

## Attribution and limitations

Narration: Piper en_GB-alba-medium. The voice model card identifies the
[University of Edinburgh DataShare](https://datashare.ed.ac.uk/handle/10283/3270)
dataset and CC BY 4.0. The downloaded result carries a voice-credits.txt
file and attribution in MP4 metadata. Review the final video and corporate
rights requirements before wider distribution.

All numerical data and the component scenario are fictional; the video
makes no claims of demonstrated Airbus operational or environmental benefits.

Only this folder and .github/workflows/video-demo.yml are added.
The application source, existing deployment workflow and published product
are left unchanged.
