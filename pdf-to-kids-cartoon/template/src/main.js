// Player: draws VIDEO at any time t, plays it with sound, and exposes __seek(t) for the renderer.
(function () {
  const params = new URLSearchParams(location.search);
  const RECORD = params.has('record');
  const TR = 0.5; // scene transition (bubble wipe) seconds
  const scenes = VIDEO.scenes; let acc = 0;
  scenes.forEach(s => { s.start = acc; acc += s.dur; });
  const DURATION = acc;
  const AUDIO = (typeof AUDIO_SRC !== 'undefined') ? AUDIO_SRC : null;
  const HAS_VOICE = (typeof HAS_VOICE_TRACK !== 'undefined') && HAS_VOICE_TRACK;
  const rtl = (VIDEO.lang || 'ar') === 'ar';

  const stage = document.getElementById('stage'), art = document.getElementById('art'), sub = document.getElementById('sub');
  if (!VIDEO.subtitles) sub.style.display = 'none';
  sub.dir = rtl ? 'rtl' : 'ltr';

  function sceneAt(t) { for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return i; return 0; }
  function safe(s, t) { try { return s.draw(Math.max(0, Math.min(s.dur, t)), s.dur); } catch (e) { console.error('scene draw error', e); return K.flat('#fdd') + K.text(960, 540, 'draw error: ' + e.message, 40, '#900', 'middle', false); } }

  let lastSub = '';
  function frame(t) {
    t = Math.max(0, Math.min(DURATION - 1e-3, t));
    const i = sceneAt(t), s = scenes[i], lt = t - s.start;
    let svg = safe(s, lt);
    if (i > 0 && lt < TR) { // bubble wipe from the centre over the previous scene's last frame
      const p = scenes[i - 1], r = K.E.inOut(lt / TR) * 1150;
      svg = safe(p, p.dur) + `<defs><clipPath id="wipe"><circle cx="960" cy="540" r="${r.toFixed(1)}"/></clipPath></defs><g clip-path="url(#wipe)">${svg}</g>` +
        `<circle cx="960" cy="540" r="${r.toFixed(1)}" fill="none" stroke="#fff" stroke-width="${(30 * (1 - lt / TR)).toFixed(1)}"/>`;
    }
    art.innerHTML = svg;
    // subtitles: chunks share the scene time in proportion to their length
    const chunks = s.subs && s.subs.length ? s.subs : [s.narration];
    const total = chunks.reduce((a, c) => a + c.length, 0); let edge = 0, idx = 0;
    const k = (lt - 0.3) / Math.max(0.1, s.dur - 0.8);
    for (let j = 0; j < chunks.length; j++) { edge += chunks[j].length / total; if (k < edge) { idx = j; break; } idx = j; }
    const txt = lt < 0.3 ? '' : chunks[idx];
    if (txt !== lastSub) { sub.textContent = txt; sub.style.visibility = txt ? 'visible' : 'hidden'; lastSub = txt; }
    if (!RECORD) updateUI(t, i);
  }
  window.__seek = frame; window.__duration = DURATION; window.__scenes = scenes.map(s => ({ start: s.start, dur: s.dur }));

  function fit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); stage.style.transform = `translate(-50%,-50%) scale(${k})`; }
  addEventListener('resize', fit); fit();

  if (RECORD) { document.body.classList.add('record'); frame(0); return; }

  // ---------- playback ----------
  const ui = document.getElementById('ui'), startBtn = document.getElementById('start');
  const bar = document.getElementById('bar'), fill = document.getElementById('fill'), count = document.getElementById('count');
  const playBtn = document.getElementById('play');
  let audio = null; if (AUDIO) { audio = new Audio(AUDIO); audio.preload = 'auto'; }
  let playing = false, t0 = 0, base = 0, muted = false, spoken = -1;
  const synth = window.speechSynthesis; let voice = null;
  function pickVoice() { if (!synth) return; const vs = synth.getVoices(); const want = rtl ? 'ar' : 'en'; voice = vs.find(v => v.lang && v.lang.toLowerCase().startsWith(want + '-iq')) || vs.find(v => v.lang && v.lang.toLowerCase().startsWith(want)) || null; }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
  function speak(i) {
    if (HAS_VOICE || !synth || muted) return; synth.cancel();
    const u = new SpeechSynthesisUtterance(scenes[i].narration); if (voice) u.voice = voice; u.lang = voice ? voice.lang : (rtl ? 'ar-IQ' : 'en-US');
    u.rate = 0.88; u.pitch = 1.25; synth.speak(u);
  }
  const now = () => audio ? audio.currentTime : base + (playing ? (performance.now() - t0) / 1000 : 0);
  function play() { if (now() >= DURATION - 0.05) seek(0); playing = true; t0 = performance.now(); if (audio) { audio.muted = muted; audio.play(); } spoken = -1; playBtn.textContent = '❚❚'; loop(); }
  function pause() { base = now(); playing = false; if (audio) audio.pause(); if (synth) synth.cancel(); playBtn.textContent = '▶'; }
  function seek(t) { base = Math.max(0, Math.min(DURATION, t)); t0 = performance.now(); if (audio) audio.currentTime = base; if (synth) synth.cancel(); spoken = -1; frame(base); }
  function loop() {
    if (!playing) return; const t = now();
    if (t >= DURATION) { pause(); base = DURATION; frame(DURATION); return; }
    const i = sceneAt(t); if (i !== spoken) { spoken = i; if (t - scenes[i].start < 1) speak(i); }
    frame(t); requestAnimationFrame(loop);
  }
  function updateUI(t, i) { fill.style.width = (100 * t / DURATION) + '%'; count.textContent = `${i + 1} / ${scenes.length}`; }
  scenes.forEach(s => { const m = document.createElement('i'); m.style.left = (100 * s.start / DURATION) + '%'; bar.appendChild(m); });
  startBtn.onclick = () => { startBtn.style.display = 'none'; ui.style.display = 'flex'; seek(0); play(); };
  playBtn.onclick = () => playing ? pause() : play();
  document.getElementById('restart').onclick = () => { seek(0); if (!playing) play(); };
  document.getElementById('mute').onclick = e => { muted = !muted; if (audio) audio.muted = muted; if (muted && synth) synth.cancel(); e.target.textContent = muted ? '🔇' : '🔊'; };
  document.getElementById('full').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  bar.onclick = e => { const r = bar.getBoundingClientRect(); seek(DURATION * (e.clientX - r.left) / r.width); };
  addEventListener('keydown', e => {
    if (startBtn.style.display !== 'none') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const i = sceneAt(now()), j = Math.max(0, Math.min(scenes.length - 1, i + ((e.code === 'ArrowRight') !== rtl ? 1 : -1))); seek(scenes[j].start); if (playing) { t0 = performance.now(); } }
  });
  document.getElementById('ttl').textContent = VIDEO.title || '';
  frame(Math.min(2, DURATION / 2));
})();
