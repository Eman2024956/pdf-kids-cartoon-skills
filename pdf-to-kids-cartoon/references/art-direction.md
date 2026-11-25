# Art direction and the kit

## Contents
1. The look
2. Layout of a frame
3. Motion rules
4. Syncing picture to words
5. Kit API (every helper)
6. Drawing things the kit doesn't have
7. Gotchas

## 1. The look

Flat, bright, rounded 2D motion graphics: thick dark outlines (`K.C.ink`, 5–8 px), soft
shadows under characters, saturated cheerful colours from `K.C`, big round shapes, no sharp
corners. It should feel like a preschool TV show, not a slide deck.

- **Nunu** (`K.mascot`) is the host in every video: an original round orange creature with a star
  antenna. Change its colour only if the PDF's subject suggests it (e.g., `color: K.C.green` for a nature
  topic) and keep the same colour for the whole video.
- **Kids** (`K.kid`) for stories and examples. Vary `skin` (0–3), `hair`, `shirt`, `girl`. Clothes modest.
- **Backgrounds**: `K.sky + K.hills` outdoors; `K.flat(colour)` for quiz and focus scenes (pale tints:
  `#FFF1C9`, `#E6F6FF`, `#F3E8FF`, `#E8FBEF`); `K.sky(t, '#1B1F4B', '#3B3F8F') + K.starfield(t)` at night.
- **Never** draw copyrighted characters, logos, or real people, even if the PDF has them. Redraw the
  idea with the kit's own shapes.
- **Text on screen is rare**: a title, one big word, or a number. Children 4–7 mostly can't read.
  Labels name what's in the picture ("الماي", "٣").

## 2. Layout of a frame (1920 × 1080)

- **Bottom 190 px belong to the subtitle pill.** Keep faces, answers and key objects above y ≈ 880.
  Ground and feet can go behind it.
- **Title zone**: y 120–230. Keep it clear when a title is showing.
- **Hero zone**: the middle (x 400–1520, y 260–860). One big subject, 350–700 px tall.
- **Nunu as host**: big and centred in hello/bye scenes (`s: 1`); small in a corner while explaining
  (`s: 0.5–0.6`, near x 220 or 1700, y ≈ 830). It looks toward the subject (`look: 1` looks right).
- **Never more than ~5 things on screen at once.** Empty space helps small eyes.

## 3. Motion rules

- **Something moves every second.** Idle motion is built in (bob, blink, clouds, sun rays); add an
  entrance or change every 1–2 s.
- **Stagger entrances** 0.4–0.8 s apart with `K.pop`. Never pop everything at once.
- **Show change, don't state it**: grow (`K.E.out(K.prog(...))` on scale), travel (lerp x/y), draw-on
  lines (`K.drawOn`), count (`K.count`), before/after side by side.
- **Celebrate answers**: `K.tick` + `K.sparkles` + `K.confetti`, Nunu `mood: 'wow', hop: true`.
- Keep the first 0.5 s of a scene calm: the bubble-wipe transition is playing over it.
- Match `sfx` to entrances: `pop` when something appears, `ding` for a question, `cheer` for a correct
  answer, `twinkle` for magic or a title, `boing` for Nunu's arrival or a bounce. 2–4 per scene is plenty.

## 4. Syncing picture to words

Browser speech and the subtitles both spread the narration across the scene, so a word's time is roughly:

  `time(word k of n) ≈ 0.3 + (k / n) × (dur − 0.8)`

Pop each picture in on the word that names it. For a recorded voice file the voice starts 0.6 s into the
scene. If timing is off after recording, nudge the `start` values in that scene's `draw`.

## 5. Kit API

All return SVG strings. `t` = local scene time in seconds. Coordinates are stage pixels.

**Time and easing**
- `K.prog(t, start, dur)` → 0..1 · `K.pop(t, start, dur=.55)` → bouncy 0→1 scale · `K.bob(t, amp, speed, phase)`
- `K.E.out / inOut / back / elastic(x)` · `K.lerp(a, b, k)` · `K.clamp(x)` · `K.rand(seed)` → deterministic random fn

**Grouping**: `K.G({x, y, s, r, o, sx, sy}, innerSvg)` — translate, rotate (deg), scale, opacity. Wrap
anything in `K.G({s: K.pop(t, 2)}, ...)` to pop it in (scale is around the group's origin, so draw the
inner thing around 0,0 or pass its x/y to G).

**Backgrounds**: `K.sky(t, top?, bottom?)`, `K.flat(colour)`, `K.hills(t, y=820, c1?, c2?)`,
`K.cloud(x, y, s, t, speed?)`, `K.sun(x, y, s, t, face=true)`, `K.starfield(t, n=30, seed)`

**Things**: `K.star(x, y, r, fill, opacity)`, `K.heart(x, y, s, fill)`, `K.tree(x, y, s, t)`,
`K.palm(x, y, s, t)` (date palm), `K.flower(x, y, s, t, colour)`, `K.house(x, y, s, wall, roof)`,
`K.drop(x, y, s, fill)` (water), `K.apple(x, y, s, fill)`, `K.balloon(x, y, s, t, fill)`,
`K.badge(x, y, label, s, fill)` (circle with a digit/letter), `K.card(x, y, w, h, fill, innerSvg)`
(rounded card; inner drawn around the card centre)

**Lines**: `K.arrow(x1, y1, x2, y2, t, start, dur, colour)` grows from 1 to 2 ·
`K.drawOn(pathD, t, start, dur, colour, width, fillWhenDone)` pen-draws any path

**Text**: `K.text(x, y, str, size, fill, anchor, outline=true)` (Arabic-safe, outlined) ·
`K.title(str, t, start, y=190, size=110, fill)` bouncing title ·
`K.bubble(x, y, w, h, str, t, start, size=64, tail='left'|'right'|'none')` speech bubble

**Characters**: `K.mascot({x, y, s, t, talk, wave, hop, look, mood: 'happy'|'wow'|'think', color})` —
origin is the body centre, feet at about y+170 × s ·
`K.kid({x, y, s, t, skin: 0-3, hair, shirt, pants, girl, talk, wave, walk, hop, flip})` — feet at about y+185 × s

**Celebration and counting**: `K.confetti(t, start, seed)`, `K.sparkles(x, y, t, start, spread)`,
`K.tick(x, y, t, start, s)`, `K.count(n, item(x,y)→svg, cx, cy, t, start, step=.6, gap=230, numbers=true)`

**Palette** `K.C`: sky1 sky2 grass grass2 sun sunDeep red orange yellow green blue purple pink ink white cream, `skin[0..3]`

## 6. Drawing things the kit doesn't have

Write a small function at the top of `scenes.js` that returns SVG built around 0,0 from circles,
ellipses, rounded rects and simple paths, with `stroke="${K.C.ink}" stroke-width="6"` and a flat fill.
Give it a face (two dots and a smile) if it's a character or a friendly object; kids love talking
objects. Examples worth reusing: a tooth, a cloud with rain lines, a fish, a cat (circle head + triangle
ears), a book, a toothbrush, a bus, an Arabic letter in a `K.badge` or as big `K.text`.

```js
function tooth(x, y, s, t) {
  return K.G({ x, y, s, r: K.bob(t, 3, 2) }, `<path d="M-60 -70 Q 0 -100 60 -70 Q 80 0 50 80 Q 35 110 20 60 Q 0 30 -20 60 Q -35 110 -50 80 Q -80 0 -60 -70 Z" fill="#fff" stroke="${K.C.ink}" stroke-width="7"/><circle cx="-22" cy="-20" r="8" fill="${K.C.ink}"/><circle cx="22" cy="-20" r="8" fill="${K.C.ink}"/><path d="M-20 10 Q 0 28 20 10" stroke="${K.C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>`);
}
```

## 7. Gotchas

- `draw(t, d)` must be **pure**: same t → same picture. No `Math.random()` (use `K.rand(seed)`), no
  `Date`, no variables that change between frames. The renderer jumps to any frame in any order.
- SVG `id`s inside `<defs>` are shared by the whole frame; during a transition two scenes are drawn
  at once, so give custom gradients/clipPaths ids unique to the scene (e.g., `id="s4glow"`).
- Arabic in SVG: use `K.text` (it sets `direction="rtl"` and the bundled font). Don't hand-write `<text>`.
- Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩) read naturally next to Arabic; use whichever the PDF uses.
- A scene grows automatically if its recorded voice is longer than `dur`; picture timings stay where
  they are, so the end of the scene simply holds longer.
