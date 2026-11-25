#!/bin/bash
# Start a kids-cartoon project from the template.  usage: new_project.sh <project-folder>
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; P="$1"
[ -z "$P" ] && { echo "usage: new_project.sh <project-folder>"; exit 1; }
[ -e "$P/src/scenes.js" ] && { echo "$P already has a project; not overwriting"; exit 1; }
mkdir -p "$P"; cp -R "$HERE/../template/." "$P/"; chmod +x "$P/make.sh"
missing=(); command -v node >/dev/null || missing+=(node); command -v ffmpeg >/dev/null || missing+=(ffmpeg); command -v ffprobe >/dev/null || missing+=(ffprobe)
[ ${#missing[@]} -gt 0 ] && { echo "missing: ${missing[*]}"; exit 1; }
cd "$P"
if ! node -e "require('playwright')" 2>/dev/null && ! node -e "require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')" 2>/dev/null; then
  echo "installing playwright + chromium (one time)"; npm init -y >/dev/null; npm install --silent --no-audit --no-fund playwright; npx playwright install chromium
fi
python3 -c "import numpy" 2>/dev/null || pip install -q --break-system-packages numpy
echo "ready: $P  — write src/scenes.js, then: bash make.sh stills  →  bash make.sh all"
