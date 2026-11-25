// Renders the built page frame by frame with headless Chromium.
// usage: node render.mjs --stills                 -> build/stills/scene-XX.png + build/contact.png (for checking)
//        node render.mjs --at 12.5                -> build/frame.png at 12.5s
//        node render.mjs --video [--workers 3]    -> out/video.mp4 (with build/audio.wav if present)
import fs from 'fs'; import path from 'path'; import { spawn, execSync, execFileSync } from 'child_process'; import { createRequire } from 'module';
const P = path.dirname(new URL(import.meta.url).pathname); const req = createRequire(import.meta.url);
function loadPW() { try { return req('playwright'); } catch { } const g = execSync('npm root -g').toString().trim(); return createRequire(path.join(g, 'x.js'))('playwright'); }
const { chromium } = loadPW();
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const FPS = 24, URL_ = 'file://' + path.join(P, 'dist/index.html') + '?record=1';
if (process.argv.includes('--stills') || process.argv.includes('--at')) {   // always draw the latest scenes.js, keep sound if built
  try { execFileSync('node', [path.join(P, 'build.mjs'), ...(fs.existsSync(path.join(P, 'build/audio.mp3')) ? ['--audio'] : [])], { stdio: ['ignore', 'ignore', 'inherit'] }); } catch (e) { }
}
const tl = JSON.parse(fs.readFileSync(path.join(P, 'build/timeline.json'), 'utf8'));

async function open() {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(URL_); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
  return { browser, page };
}
async function shot(page, t, file) { await page.evaluate(t => window.__seek(t), t); await page.screenshot({ path: file, type: file.endsWith('.png') ? 'png' : 'jpeg', quality: file.endsWith('.png') ? undefined : 92 }); }

if (process.argv.includes('--stills')) {
  const dir = path.join(P, 'build/stills'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await open(); const files = [];
  let k = 0; for (let i = 0; i < tl.scenes.length; i++) { const s = tl.scenes[i]; for (const at of [0.5, 0.95]) { const f = path.join(dir, `shot-${String(++k).padStart(2, '0')}.png`); await shot(page, s.start + s.dur * at, f); files.push(f); if (at > 0.9) fs.copyFileSync(f, path.join(dir, `scene-${String(i + 1).padStart(2, '0')}.png`)); } }
  await browser.close();
  const cols = Math.min(4, files.length), rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(dir, 'shot-%02d.png'), '-vf', `scale=640:360,tile=${cols}x${rows}:padding=8:color=white`, '-frames:v', '1', path.join(P, 'build/contact.png')]);
  console.log(`stills: 2 per scene (middle, end) -> build/contact.png (each row = 2 scenes, read left to right)`);
} else if (process.argv.includes('--at')) {
  const { browser, page } = await open(); await shot(page, parseFloat(arg('--at', '0')), path.join(P, 'build/frame.png')); await browser.close(); console.log('build/frame.png');
} else if (process.argv.includes('--video')) {
  const N = Math.round(tl.duration * FPS), W = Math.max(1, parseInt(arg('--workers', '3'))); const per = Math.ceil(N / W);
  fs.mkdirSync(path.join(P, 'out'), { recursive: true }); const t0 = Date.now(); let done = 0;
  const part = async (w) => {
    const a = w * per, b = Math.min(N, a + per); if (a >= b) return null; const out = path.join(P, `build/part-${w}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const { browser, page } = await open();
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.__seek(t), f / FPS); const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 120 === 0) console.log(`  ${done}/${N} frames (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    await browser.close(); ff.stdin.end(); await new Promise(r => ff.on('close', r)); return out;
  };
  const parts = (await Promise.all([...Array(W).keys()].map(part))).filter(Boolean);
  const list = path.join(P, 'build/parts.txt'); fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  const wav = path.join(P, 'build/audio.wav'), out = path.join(P, 'out/video.mp4');
  const a = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (fs.existsSync(wav)) a.push('-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest'); else a.push('-c', 'copy');
  a.push('-movflags', '+faststart', out); execFileSync('ffmpeg', a);
  parts.forEach(p => fs.rmSync(p)); console.log(`out/video.mp4 — ${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
} else { console.log('usage: node render.mjs --stills | --at <sec> | --video [--workers N]'); }
