// Builds dist/index.html (one self-contained file) and build/timeline.json.
// usage: node build.mjs            -> preview build (no soundtrack embedded)
//        node build.mjs --audio    -> embeds build/audio.mp3 if it exists
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { execFileSync } from 'child_process';
const P = path.dirname(new URL(import.meta.url).pathname);
const rd = f => fs.readFileSync(path.join(P, f), 'utf8');
fs.mkdirSync(path.join(P, 'build'), { recursive: true }); fs.mkdirSync(path.join(P, 'dist'), { recursive: true });

const kit = rd('src/kit.js'), scenesSrc = rd('src/scenes.js'), main = rd('src/main.js');
const ctx = { console, module: undefined }; vm.createContext(ctx);
vm.runInContext(kit + '\n' + scenesSrc + '\nthis.VIDEO = VIDEO; this.K = K;', ctx);
const V = ctx.VIDEO; const problems = [], notes = [];
if (!V || !Array.isArray(V.scenes) || !V.scenes.length) { console.error('scenes.js must define VIDEO.scenes'); process.exit(1); }

// voice files: voice/scene-01.mp3 (or .wav/.m4a/.ogg) -> scene 1. A scene grows to fit its voice.
const vdir = path.join(P, 'voice'); const voices = {};
const probe = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
if (fs.existsSync(vdir)) for (const f of fs.readdirSync(vdir)) { const m = f.match(/^scene-(\d+)\.(mp3|wav|m4a|ogg)$/i); if (m) voices[parseInt(m[1]) - 1] = path.join(vdir, f); }
const VOICE_LEAD = 0.6; const overrides = {};
V.scenes.forEach((s, i) => {
  if (voices[i]) { const len = probe(voices[i]); const need = Math.ceil((VOICE_LEAD + len + 0.9) * 2) / 2; if (need > s.dur) { overrides[i] = need; notes.push(`scene ${i + 1}: voice is ${len.toFixed(1)}s, scene grown ${s.dur}s -> ${need}s`); s.dur = need; } }
  // checks that matter for ages 4-7
  const words = (s.narration || '').trim().split(/\s+/).filter(Boolean).length;
  if (!voices[i] && words / s.dur > 1.9) problems.push(`scene ${i + 1}: ${words} words in ${s.dur}s is too fast for small kids (aim for <= ${Math.floor(s.dur * 1.7)} words, or make the scene longer)`);
  (s.subs || []).forEach((c, j) => { if (c.length > 48) problems.push(`scene ${i + 1} sub ${j + 1}: ${c.length} chars — keep each subtitle line under ~45 characters`); });
  for (const t of [0, s.dur * 0.25, s.dur * 0.5, s.dur * 0.75, s.dur]) { try { const out = s.draw(t, s.dur); if (typeof out !== 'string' || out.length < 20) problems.push(`scene ${i + 1}: draw(${t.toFixed(1)}) returned almost nothing`); if (/NaN|undefined/.test(out)) problems.push(`scene ${i + 1}: draw(${t.toFixed(1)}) output contains NaN/undefined`); } catch (e) { problems.push(`scene ${i + 1}: draw(${t.toFixed(1)}) threw ${e.message}`); } }
});
let acc = 0; const tl = { title: V.title, duration: 0, hasVoice: Object.keys(voices).length > 0, voiceLead: VOICE_LEAD, scenes: [] };
V.scenes.forEach((s, i) => { tl.scenes.push({ start: acc, dur: s.dur, sfx: s.sfx || [], voice: voices[i] || null }); acc += s.dur; });
tl.duration = acc; fs.writeFileSync(path.join(P, 'build/timeline.json'), JSON.stringify(tl, null, 1));
// voice script for recording: one file per scene, named so build picks it up
const mmss = x => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
const en = V.lang === 'en';
fs.writeFileSync(path.join(P, 'build/narration.md'), en ? `# ${V.title || ''} — voice-over script\n\nRecord each scene as its own file: scene-01.mp3, scene-02.mp3 … put them in voice/ and rebuild. Voice: warm, smiling, a little slow (ages 4–7).\n\n| Scene | File | Time | Line |\n|---|---|---|---|\n` + V.scenes.map((s, i) => `| ${i + 1} | scene-${String(i + 1).padStart(2, '0')}.mp3 | ${mmss(tl.scenes[i].start)}–${mmss(tl.scenes[i].start + s.dur)} | ${s.narration} |`).join('\n') + '\n' : `# ${V.title || ''} — نص التعليق الصوتي\n\nسجّل كل مشهد بملف مستقل باسم scene-01.mp3 ، scene-02.mp3 … وضعها بمجلد voice/ ثم أعد البناء. الصوت: دافئ، مبتسم، بطيء شوي (أطفال ٤–٧ سنوات).\n\n| المشهد | الملف | الوقت | النص |\n|---|---|---|---|\n` +
  V.scenes.map((s, i) => `| ${i + 1} | scene-${String(i + 1).padStart(2, '0')}.mp3 | ${mmss(tl.scenes[i].start)}–${mmss(tl.scenes[i].start + s.dur)} | ${s.narration} |`).join('\n') + '\n');

const b64 = f => fs.readFileSync(path.join(P, f)).toString('base64');
let audio = ''; const mp3 = path.join(P, 'build/audio.mp3');
if (process.argv.includes('--audio') && fs.existsSync(mp3)) audio = `var AUDIO_SRC='data:audio/mpeg;base64,${fs.readFileSync(mp3).toString('base64')}';var HAS_VOICE_TRACK=${tl.hasVoice};`;
const ov = Object.entries(overrides).map(([i, d]) => `VIDEO.scenes[${i}].dur=${d};`).join('');
const esc = s => s.replace(/<\/script/gi, '<\\/script');
const html = rd('src/shell.html')
  .replace('__TITLE__', () => (V.title || 'Cartoon').replace(/</g, ''))
  .replace('__FONT_AR__', () => b64('src/assets/kids-ar-800.woff2')).replace('__FONT_LATIN__', () => b64('src/assets/kids-latin-800.woff2'))
  .replace('__AUDIO__', () => audio).replace('__KIT__', () => esc(kit)).replace('__SCENES__', () => esc(scenesSrc) + '\n' + ov).replace('__MAIN__', () => esc(main))
  .replace('<html lang="ar">', `<html lang="${V.lang || 'ar'}">`);
fs.writeFileSync(path.join(P, 'dist/index.html'), html);
console.log(`built dist/index.html — ${V.scenes.length} scenes, ${acc.toFixed(1)}s${audio ? ', soundtrack embedded' : ''} (${(html.length / 1024).toFixed(0)} KB)`);
notes.forEach(n => console.log('note: ' + n));
if (problems.length) { console.log('\nFIX THESE:'); problems.forEach(p => console.log(' - ' + p)); process.exitCode = 2; }
