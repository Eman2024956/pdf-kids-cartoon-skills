# PDF → Kids' Cartoon (Claude skill)

A Claude skill that turns any PDF (a lesson, story, worksheet or school chapter) into a bright 2D
cartoon motion-graphics video for children aged 4–7. Nunu, an original orange mascot, narrates it
in Iraqi (Baghdadi) Arabic.

**مهارة لـ Claude تحوّل أي ملف PDF إلى فيديو كارتون موشن جرافيك للأطفال (٤–٧ سنوات)، بتعليق باللهجة البغدادية وشخصية "نونو".**

## What you get
- `index.html`: one self-contained page that plays the cartoon with music, sound effects and subtitles. The browser reads the narration aloud.
- `video.mp4`: 1920×1080 at 24 fps, with music, sound effects and subtitles.
- `narration.md`: a recording script with one file per scene. Put your recordings in `voice/` as `scene-01.mp3`, `scene-02.mp3`, … and rebuild. The scenes stretch to fit and the music drops under the voice.

## Install
- **Claude.ai:** upload `dist/pdf-to-kids-cartoon.skill` under Settings → Capabilities → Skills, or press "Save skill" on the file card in a chat.
- **Claude Code:** copy `pdf-to-kids-cartoon/` into `~/.claude/skills/`.

Then attach a PDF and ask, for example: `حول هذا الملف لكارتون للأطفال`.

## How it works
1. `scripts/extract_pdf.py` pulls each page's text and a picture of each page. Arabic text extracted from PDFs is often garbled, so the page images are checked too.
2. The content is simplified for small children. The video opens with a hello, has one idea per scene and a question with the answer revealed, then says bye. The PDF's size sets the number of scenes, from 6 up to 14.
3. The scenes are drawn in code with an SVG cartoon kit (`template/src/kit.js`). The same code drives the HTML player and the frame-by-frame MP4 render, which uses Playwright and ffmpeg.
4. `template/audio.py` makes the music and sound effects, and mixes in any voice files you add.

Requirements: node, ffmpeg, python3 with numpy, and Playwright with Chromium (`scripts/new_project.sh` installs Playwright and Chromium if they're missing).

## Layout
```
pdf-to-kids-cartoon/
├── SKILL.md                 # the workflow Claude follows
├── references/              # kid-writing rules, Iraqi vocabulary, art direction and the kit API
├── scripts/                 # extract_pdf.py, new_project.sh
├── template/                # player, kit, renderer, audio, bundled font (OFL)
└── evals/                   # 3 test cases with sample PDFs
dist/pdf-to-kids-cartoon.skill
```

The font is Baloo Bhaijaan 2, licensed under the SIL Open Font License (see `template/src/assets/FONT-LICENSE.txt`).
