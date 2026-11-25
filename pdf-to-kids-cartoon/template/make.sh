#!/bin/bash
# One command for each stage.  bash make.sh check | stills | all
#   check  -> build + validate scenes (fast, no browser)
#   stills -> build + one still per scene + contact sheet (look at build/contact.png)
#   all    -> build, soundtrack, final HTML with sound, MP4
set -e; cd "$(dirname "$0")"; MODE="${1:-all}"
node build.mjs $( [ -f build/audio.mp3 ] && echo --audio ) || { [ $? -eq 2 ] && echo "(warnings above — fix before delivering)"; }
[ "$MODE" = check ] && exit 0
if [ "$MODE" = stills ]; then node render.mjs --stills; exit 0; fi
python3 audio.py
node build.mjs --audio
node render.mjs --video --workers "${WORKERS:-3}"
ls -la dist/index.html out/video.mp4
