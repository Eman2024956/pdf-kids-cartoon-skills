# Writing for ages 4–7 in Iraqi (Baghdadi) Arabic

## Contents
1. Turning a PDF into kid ideas
2. Narration rules
3. Iraqi kids' voice: words and phrases
4. Scene patterns (hello, idea, quiz, recap)
5. Before / after examples
6. Other ages and languages

## 1. Turning a PDF into kid ideas

A PDF is written for whoever made it: a teacher, a parent, a company. Your job is to find the
2–6 things a five-year-old could understand and remember, and drop everything else.

- **Ask "what would a child tell their mum after watching?"** That sentence is the core of the video.
  Every scene should support it.
- **One idea per scene.** "Plants need water" is one scene. "Plants need water, sun and soil" is three
  scenes, or one scene that pops the three in one by one.
- **Concrete beats abstract.** "Photosynthesis" becomes "the leaf eats sunlight". "Fractions" becomes
  "cut the samoon in half". Numbers above 10 rarely belong; "lots and lots" does the job.
- **Facts stay true.** Simplify, never invent. If the PDF says something false or unsafe, leave it out.
  If the topic needs a fact the PDF doesn't give, check it.
- **Story PDFs** (a tale, a fable): retell the plot in order, with the PDF's characters drawn as K.kid or
  animals made from simple shapes, and end with the lesson in one sentence.
- **Lesson PDFs** (science, letters, numbers, hygiene, manners, religion basics): the hello, idea…idea,
  quiz, recap pattern below.
- **Worksheets / exercise PDFs**: turn the exercises into "let's try together" quiz scenes with the answer
  revealed.
- **PDFs not written for children** (a report, a manual): find the kid-sized version of the subject (a bank
  report becomes "saving money in a piggy bank"). Say in one line in the delivery what angle you took.
- **Leave out anything scary or unsuitable for little kids** (violence, death in detail, adult themes).
  Say what was left out.

## 2. Narration rules

- **Speed:** about 1.5–1.7 words per second, so 12–16 words in an 8–10 s scene. `build.mjs` warns above 1.9.
- **Short sentences**, 3–7 words. A pause ("…") between ideas.
- **Talk to the child**: "شوفوا!", "تعرفون شنو؟", "يلا نعد سوا!". Questions keep them watching.
- **Repeat the key word.** A small kid needs to hear "الشمس" three times to keep it.
- **Praise in every quiz:** "عفية عليكم!", "شطّار!", "برافو!".
- **Subtitles** (`subs`): the same words cut into 1–3 lines, each under ~45 characters. They're for the
  parent watching along; small kids follow the picture and the voice.
- Write in Iraqi dialect but **keep content words clear and standard** (الشمس، الماي، الشجرة، الحروف),
  so the video also helps at school. Dialect lives in the connecting words: شنو، هسه، هواية، كلش، أكو، ماكو.

## 3. Iraqi kids' voice: words and phrases

| Use | Instead of (Fusha) | Notes |
|---|---|---|
| هلا حبايبي / هلو أصدقائي | مرحباً يا أطفال | opening |
| آني نونو | أنا نونو | the mascot introduces itself |
| شنو / ليش / وين / شلون / شكد | ماذا / لماذا / أين / كيف / كم | questions |
| هسه | الآن | |
| هواية / كلش | كثيراً / جداً | "كلش حلو" |
| أكو / ماكو | يوجد / لا يوجد | |
| يلا / خل نشوف / تعالوا وياي | هيا / لنرى / تعالوا معي | moving on |
| سوا / ويانا | معاً / معنا | |
| يمعودين! / واو! | | surprise |
| صح! / غلط | صحيح / خطأ | quiz |
| عفية عليكم / شطّار / برافو | أحسنتم | praise |
| ماي | ماء | |
| ينطي / تنطينا | يعطي / تعطينا | |
| يريد / نريد | يريد | |
| ديروا بالكم | انتبهوا | safety tips |
| باي باي حبايبي، نشوفكم بالدرس الجاي! | إلى اللقاء | closing |

Local touches that make it feel like home (use when they fit, never forced): نخل، دجلة، سمون، كاهي،
تمر، شاي، المدرسة، جدو وبيبي، أسماء: علي، زهراء، حسين، مريم، يوسف، نور، آدم، فاطمة.

## 4. Scene patterns

- **Hello (scene 1, ~8 s):** Nunu pops in, waves, says hello and names today's topic. Topic title bounces in.
- **Idea (most scenes, 8–10 s):** one idea, shown as a thing that moves or changes. Nunu small in a
  corner, talking. Big picture in the middle.
- **Quiz (after every 3–4 idea scenes, ~9–10 s):** "سؤال!" + two picture choices. Wait about 2 s of
  "thinking" (Nunu mood 'think'), then reveal: tick, sparkles, confetti, praise.
- **Recap + bye (last scene, ~8–9 s):** the 2–3 key pictures shown again in a row, then Nunu waves bye.

## 5. Before / after

PDF text: "تحتاج النباتات إلى الماء والضوء والهواء لكي تنمو، وتمتص الجذور الماء من التربة."
Kid scenes:
- "النبتة الصغيرة جوعانة! شنو تحتاج حتى تكبر؟" (idea: tiny sprout, Nunu 'think')
- "تحتاج ماي… وشمس… وهوا!" (three cards pop in one by one with the words)
- "الجذور تشرب الماي من التراب… مثل الماصة!" (drops travel up a root drawn with drawOn)

PDF text: "Hand washing for 20 seconds removes germs."
Kid scene: "نغسل إيدينا بالماي والصابون… ونعد لعشرين! يلا وياي: واحد، اثنين، ثلاثة…" (count helper, bubbles)

## 6. Other ages and languages

The defaults are Iraqi dialect and ages 4–7. If the person asks for something else, adapt:
- **Ages 8–12:** up to 2.2 words/s, real terms with a one-line explanation, 2 quiz options → 3, a
  "did you know?" fact scene. Allow 10–12 s scenes.
- **Fusha (MSA):** same rules, simple Fusha ("هيا بنا", "أحسنتم"). Set nothing else differently.
- **English:** set `VIDEO.lang = 'en'`; same pacing rules (about 1.8 words/s for ages 4–7).
- **Other Arabic dialects** (Gulf, Egyptian, Levantine): keep the structure, swap the connecting words.
