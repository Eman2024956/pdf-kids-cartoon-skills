---
name: pdf-to-kids-cartoon
description: Turn any PDF (a lesson, story, worksheet, school chapter, book) into a cartoon motion-graphics video for kids aged 4–7, narrated in Iraqi (Baghdadi) Arabic by Nunu the mascot, delivered as a playable HTML page plus an MP4 with music, sound effects and subtitles. Use whenever someone attaches a PDF and wants it as a cartoon, animation, motion graphics or animated video for children, even if they never say "motion graphics". Arabic requests count too, e.g. حول الملف لكارتون, حول الـPDF لفيديو أطفال, اعمل كارتون من هذا الدرس, رسوم متحركة, موشن جرافيك للأطفال, فيديو تعليمي للأطفال من الملف.
---

# PDF → kids' cartoon motion graphics

Turns a PDF into a short, bright, flat 2D cartoon in which Nunu (an original round orange mascot
with a star antenna) explains the PDF to small children, scene by scene. Every frame is drawn in code,
so the result is free, editable, and the same in the HTML page and the MP4.

Below, `SK` is this skill's folder and `P` is the project folder for one video.

## Defaults: don't ask about these

- **Audience**: ages 4–7. **Narration**: Iraqi Baghdadi Arabic. **Format**: 16:9, 1920×1080, 24 fps.
- **Length**: set by how much the PDF holds (table in step 3).
- Change a default only when the person asks (another age, Fusha, English, 9:16). `references/kids-writing.md`
  §6 says how. If the PDF is missing, ask for it; that is the only question. Otherwise start right away
  and name any choice you made in one line when you deliver.

## 1. Read the PDF

```bash
python3 "$SK/scripts/extract_pdf.py" "<file.pdf>" "$P/pdf"
```

This writes `pdf/text.md` (text per page), `pdf/pages/page-XX.png` (small page pictures) and
`pdf/summary.json` (page count, language, pages with no text). Read `text.md`. Look at the page
pictures for any page listed as having little or no text (scanned pages, picture books, diagrams)
and read them with your own eyes. A fully scanned PDF is fine: work from the page images.
Arabic PDFs often extract with letters out of order or hamzas missing (في shows up as يف): when
`text.md` reads oddly, read the page images and trust them over the text. Pictures in
the PDF are references for *what* to show; redraw them in the kit's style, never paste them in.

## 2. Find what a child should take away

Read `references/kids-writing.md` now. It holds the rules for simplifying, the narration speed, the
Iraqi kids' vocabulary and the scene patterns. In short: write the one sentence a child would tell
their mum after watching, then pick the 2–6 ideas that support it, one idea per scene, concrete and true.

## 3. Plan the scenes

| PDF size | Scenes | About |
|---|---|---|
| 1–2 pages, or under ~1,500 characters | 6 | 50–60 s |
| 3–8 pages | 8 | 70–80 s |
| 9–20 pages | 10–12 | 1.5–2 min |
| more than 20 pages | 12–14 (cap) | 2–2.5 min; pick the key ideas, and offer a part 2 for the rest |

When the page count and the amount of text point to different rows, go by the amount of text.

Shape: **hello** (Nunu + topic title) → **idea** scenes → a **quiz** scene ("سؤال!" with two picture
choices and a reveal) after every 3–4 ideas → **recap + bye**. Scenes are 7–10 s; narration about
1.5–1.7 words per second (12–16 words per 9 s scene).

Write the plan as a short table (scene, narration, what's on screen) and post it to the person
in their language as a heads-up, then keep building without waiting, unless they asked to approve it first.

## 4. Build

```bash
bash "$SK/scripts/new_project.sh" "$P"      # copies the template, checks node, ffmpeg, Chromium
```

Read `references/art-direction.md` (the look, the layout, motion rules, and the full kit API), then
replace the example in `$P/src/scenes.js` with this video's scenes. The example there shows a hello,
an idea, a quiz and a bye scene; follow its structure. Each scene has `dur`, `narration`, `subs`
(the narration cut into short subtitle lines), optional `sfx`, and a pure `draw(t, d)` that returns
SVG made from `K.*` helpers and small custom shapes.

What makes it good rather than a slideshow: one big moving subject per scene, entrances staggered on
the words that name them, change shown (things grow, travel, get counted, draw themselves),
almost no on-screen text, and Nunu reacting.

## 5. Look, fix, render

```bash
cd "$P" && bash make.sh check     # validates every scene: pacing, subtitle length, draw errors
bash make.sh stills               # two stills per scene (middle, end) -> build/contact.png
```

`check` must print no "FIX THESE" lines. Then **look at `build/contact.png`** (and single stills in
`build/stills/` if something is unclear) and fix what you see: anything hidden behind the subtitle pill,
overlapping, too small, off-frame, empty, or not matching the narration. To check a moment,
`node render.mjs --at <seconds>` writes `build/frame.png` (it rebuilds from `scenes.js` first). Repeat until every scene reads clearly.

```bash
bash make.sh all                  # music + effects -> dist/index.html (with sound) + out/video.mp4
```

A 60 s video renders in 1–2 minutes with 3 workers (several minutes with `WORKERS=1` on a small machine). Afterwards, pull 2–3 frames from the MP4 (one mid-transition)
with ffmpeg and look at them to make sure the final video matches the stills.

## 6. The voice

There is no offline text-to-speech that speaks Iraqi dialect, so:

- **The HTML page** reads each scene's narration aloud with the browser's own Arabic voice (works
  best in Chrome/Edge; the accent is the browser's, not Iraqi).
- **The MP4** carries music, sound effects and subtitles, and no voice until voice files exist.
- **For a real voice**: `build/narration.md` is a recording script, one line per scene with its
  file name. When the person drops recordings into `$P/voice/` as `scene-01.mp3`, `scene-02.mp3`, and so on
  (their own voice, or a TTS tool they like), run `bash make.sh all` again: scenes stretch to fit each
  recording, the music ducks under the voice, and both the HTML and the MP4 get the real voice.
- If Higgsfield tools are available in the session, you may offer, once, to generate the narration
  with them. Check the cost first with its estimate tool and get a clear yes, because it spends credits.
  Save each result as `voice/scene-NN.mp3`.

Tell the person this in one or two plain sentences at delivery. Don't bury it.

## 7. Deliver

- Publish `dist/index.html` as an artifact if an artifact/publish tool exists (it's one self-contained
  file, so it plays anywhere and can be shared). Otherwise send the file.
- Send `out/video.mp4` and `build/narration.md` to the person.
- Reply in the person's language, briefly: what the video teaches (the one sentence), its length and
  scene count, the voice note from step 6, anything from the PDF that was left out, and one next step
  (record the voice, a 9:16 version for Reels, part 2). Don't recap the build steps.

## Changes after delivery

Edit `src/scenes.js` and run `bash make.sh all` again, then republish to the same artifact and resend
the MP4. Common asks: slower narration (shorter text or longer `dur`), a different mascot colour, a
scene redrawn, another dialect, 9:16 (change the stage size in `src/shell.html`, `render.mjs` viewport
and `main.js` fit, and recompose scenes for a tall frame).
