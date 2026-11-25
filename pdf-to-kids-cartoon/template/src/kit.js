// Kids cartoon kit: every function returns an SVG string for ONE moment in time.
// Nothing here keeps state, so frame t always looks the same (that is what lets
// render.mjs capture frames in any order). Stage is 1920 x 1080.
var K = (function () {
  const W = 1920, H = 1080;

  // ---------- time + easing ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    out: x => 1 - Math.pow(1 - clamp(x), 3),
    inOut: x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    back: x => { x = clamp(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    elastic: x => { x = clamp(x); if (x === 0 || x === 1) return x; return Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI) / 3) + 1; },
  };
  // progress of an action that starts at `start` and lasts `dur` seconds (0..1)
  const prog = (t, start, dur = 0.6) => clamp((t - start) / dur);
  // scale for a bouncy entrance (0 before start, overshoots, settles at 1)
  const pop = (t, start, dur = 0.55) => t < start ? 0 : E.back(prog(t, start, dur));
  // gentle idle motion
  const bob = (t, amp = 10, speed = 2, phase = 0) => Math.sin(t * speed + phase) * amp;
  // deterministic random (same seed -> same numbers on every frame)
  const rand = seed => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

  // ---------- grouping ----------
  // G({x, y, s, r, o, sx, sy}, inner) -> <g> with transform and opacity
  function G(o, inner) {
    const x = o.x || 0, y = o.y || 0, s = o.s === undefined ? 1 : o.s, r = o.r || 0;
    const sx = (o.sx === undefined ? 1 : o.sx) * s, sy = (o.sy === undefined ? 1 : o.sy) * s;
    const op = o.o === undefined ? 1 : o.o;
    if (sx === 0 || sy === 0 || op <= 0) return '';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})"${op < 1 ? ` opacity="${op.toFixed(3)}"` : ''}>${inner}</g>`;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---------- palette (bright, friendly, high contrast) ----------
  const C = {
    sky1: '#7FD3FF', sky2: '#D6F3FF', grass: '#7ED957', grass2: '#5BBF3A', sun: '#FFD23F', sunDeep: '#FFB000',
    red: '#FF5A5F', orange: '#FF9F1C', yellow: '#FFD23F', green: '#3DDC97', blue: '#3A86FF', purple: '#9B5DE5', pink: '#FF70A6',
    ink: '#2B2D42', white: '#FFFFFF', cream: '#FFF8E7', skin: ['#F9D3B4', '#E8B48F', '#C68B59', '#8D5524'],
  };

  // ---------- backgrounds ----------
  function sky(t, top = C.sky1, bottom = C.sky2) {
    const id = 'sky' + (top + bottom).replace(/[^0-9a-z]/gi, '');
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
  }
  function flat(color) { return `<rect width="${W}" height="${H}" fill="${color}"/>`; }
  // rolling hills; y = top of the ground
  function hills(t, y = 820, c1 = C.grass, c2 = C.grass2) {
    return `<path d="M0 ${y + 40} Q 480 ${y - 60} 960 ${y + 20} T 1920 ${y} V ${H} H 0 Z" fill="${c2}"/>` +
      `<path d="M0 ${y + 90} Q 600 ${y + 10} 1200 ${y + 80} T 1920 ${y + 60} V ${H} H 0 Z" fill="${c1}"/>`;
  }
  function cloud(x, y, s = 1, t = 0, speed = 12) {
    const dx = ((x + t * speed) % (W + 400)) - 200;
    return G({ x: dx, y: y + bob(t, 6, 0.8, x), s }, `<g fill="#fff"><ellipse cx="0" cy="0" rx="90" ry="55"/><ellipse cx="-70" cy="15" rx="60" ry="42"/><ellipse cx="75" cy="12" rx="65" ry="45"/><ellipse cx="10" cy="-35" rx="55" ry="45"/></g>`);
  }
  function sun(x, y, s = 1, t = 0, face = true) {
    let rays = '';
    for (let i = 0; i < 12; i++) rays += `<rect x="-10" y="-150" width="20" height="45" rx="10" fill="${C.sunDeep}" transform="rotate(${i * 30})"/>`;
    const f = face ? `<circle cx="-28" cy="-12" r="9" fill="${C.ink}"/><circle cx="28" cy="-12" r="9" fill="${C.ink}"/><path d="M-30 20 Q0 48 30 20" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="-50" cy="15" r="12" fill="${C.pink}" opacity=".5"/><circle cx="50" cy="15" r="12" fill="${C.pink}" opacity=".5"/>` : '';
    return G({ x, y, s }, `<g transform="rotate(${(t * 15) % 360})">${rays}</g><circle r="90" fill="${C.sun}"/>${f}`);
  }
  // twinkling stars across the top (night or "magic" scenes)
  function starfield(t, n = 30, seed = 3) {
    const r = rand(seed); let out = '';
    for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * 0.6, k = 0.5 + 0.5 * Math.sin(t * 3 + i); out += star(x, y, 8 + r() * 10, '#FFF6B0', k); }
    return out;
  }

  // ---------- simple shapes ----------
  function star(x, y, r = 40, fill = C.yellow, o = 1) {
    let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p += `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)} `; }
    return `<polygon points="${p}" fill="${fill}" opacity="${o}" stroke="${C.ink}" stroke-width="${Math.max(2, r / 12)}" stroke-linejoin="round"/>`;
  }
  function heart(x, y, s = 1, fill = C.red) { return G({ x, y, s }, `<path d="M0 30 C -60 -10 -40 -60 0 -30 C 40 -60 60 -10 0 30 Z" fill="${fill}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`); }
  function tree(x, y, s = 1, t = 0) {
    return G({ x, y, s, r: bob(t, 1.5, 1.3, x) }, `<rect x="-22" y="-10" width="44" height="170" rx="16" fill="#9C6644"/><circle cx="0" cy="-90" r="110" fill="${C.grass2}"/><circle cx="-70" cy="-40" r="70" fill="${C.grass}"/><circle cx="70" cy="-50" r="75" fill="${C.grass}"/><circle cx="-30" cy="-120" r="20" fill="${C.red}"/><circle cx="45" cy="-80" r="18" fill="${C.red}"/>`);
  }
  // date palm — the Iraqi landscape tree
  function palm(x, y, s = 1, t = 0) {
    let fr = ''; for (let i = 0; i < 7; i++) { const a = -160 + i * 23 + bob(t, 3, 1.4, i); fr += `<path d="M0 0 Q ${Math.cos(a * Math.PI / 180) * 120} ${Math.sin(a * Math.PI / 180) * 120 - 40} ${Math.cos(a * Math.PI / 180) * 220} ${Math.sin(a * Math.PI / 180) * 220 + 30}" stroke="${C.grass2}" stroke-width="34" fill="none" stroke-linecap="round"/>`; }
    let trunk = ''; for (let i = 0; i < 9; i++) trunk += `<path d="M-26 ${-i * 42} Q 0 ${-i * 42 - 14} 26 ${-i * 42}" stroke="#7A4E2D" stroke-width="8" fill="none"/>`;
    return G({ x, y, s, r: bob(t, 1.2, 1.1, x) }, `<path d="M-28 0 Q -10 -200 -6 -390 L 6 -390 Q 10 -200 28 0 Z" fill="#A47148"/>${trunk}<g transform="translate(0 -390)">${fr}<circle cx="-14" cy="22" r="13" fill="${C.orange}"/><circle cx="10" cy="28" r="13" fill="#C46A1B"/><circle cx="-2" cy="40" r="12" fill="${C.orange}"/></g>`);
  }
  // counting: draws n copies of item(x, y) in a row, popping in one by one from `start`, `step` s apart,
  // with a number badge under each. Great for maths and "how many?" questions.
  function count(n, item, cx, cy, t, start = 0, step = 0.6, gap = 230, numbers = true) {
    let out = ''; const x0 = cx - (n - 1) * gap / 2;
    for (let i = 0; i < n; i++) { const s = pop(t, start + i * step); if (!s) continue; out += G({ x: x0 + i * gap, y: cy, s }, item(0, 0) + (numbers ? badge(0, 150, String(i + 1), 0.55, C.blue) : '')); }
    return out;
  }
  function flower(x, y, s = 1, t = 0, color = C.pink) {
    let pet = ''; for (let i = 0; i < 6; i++) pet += `<ellipse cx="0" cy="-32" rx="18" ry="30" fill="${color}" transform="rotate(${i * 60})"/>`;
    return G({ x, y, s, r: bob(t, 4, 2, x) }, `<path d="M0 0 Q 10 70 0 140" stroke="${C.grass2}" stroke-width="10" fill="none"/><g>${pet}</g><circle r="20" fill="${C.yellow}"/>`);
  }
  function house(x, y, s = 1, wall = C.cream, roof = C.red) {
    return G({ x, y, s }, `<rect x="-150" y="-160" width="300" height="220" rx="14" fill="${wall}" stroke="${C.ink}" stroke-width="7"/><path d="M-190 -150 L0 -320 L190 -150 Z" fill="${roof}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/><rect x="-40" y="-60" width="80" height="120" rx="10" fill="${C.orange}" stroke="${C.ink}" stroke-width="6"/><rect x="-125" y="-120" width="60" height="60" rx="8" fill="${C.sky1}" stroke="${C.ink}" stroke-width="6"/><rect x="65" y="-120" width="60" height="60" rx="8" fill="${C.sky1}" stroke="${C.ink}" stroke-width="6"/>`);
  }
  function drop(x, y, s = 1, fill = C.blue) { return G({ x, y, s }, `<path d="M0 -60 C 30 -20 45 5 45 25 A45 45 0 0 1 -45 25 C -45 5 -30 -20 0 -60 Z" fill="${fill}" stroke="${C.ink}" stroke-width="5"/><ellipse cx="-15" cy="15" rx="9" ry="14" fill="#fff" opacity=".7"/>`); }
  function apple(x, y, s = 1, fill = C.red) { return G({ x, y, s }, `<path d="M0 -40 C -60 -70 -80 0 -50 40 C -30 70 -10 60 0 55 C 10 60 30 70 50 40 C 80 0 60 -70 0 -40 Z" fill="${fill}" stroke="${C.ink}" stroke-width="5"/><path d="M0 -40 Q 5 -65 20 -75" stroke="#6B4226" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="25" cy="-62" rx="18" ry="9" fill="${C.green}" transform="rotate(-30 25 -62)"/>`); }
  function balloon(x, y, s = 1, t = 0, fill = C.purple) { return G({ x, y: y + bob(t, 14, 1.6, x), s, r: bob(t, 4, 1.2, x) }, `<path d="M0 80 Q 15 140 -5 220" stroke="${C.ink}" stroke-width="3" fill="none"/><ellipse cx="0" cy="0" rx="60" ry="75" fill="${fill}" stroke="${C.ink}" stroke-width="5"/><path d="M-8 75 L8 75 L0 90 Z" fill="${fill}"/><ellipse cx="-22" cy="-28" rx="12" ry="20" fill="#fff" opacity=".5"/>`); }
  // a numbered badge / circle with a big digit or letter in it
  function badge(x, y, label, s = 1, fill = C.orange) { return G({ x, y, s }, `<circle r="70" fill="${fill}" stroke="${C.ink}" stroke-width="7"/>${text(0, 26, label, 80, '#fff', 'middle', false)}`); }
  // rounded card to hold an icon or a word
  function card(x, y, w, h, fill = C.white, inner = '') { return G({ x, y }, `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="36" fill="${fill}" stroke="${C.ink}" stroke-width="7"/><rect x="${-w / 2 + 10}" y="${h / 2 - 22}" width="${w - 20}" height="12" rx="6" fill="#000" opacity=".06"/>${inner}`); }
  function arrow(x1, y1, x2, y2, t, start, dur = 0.7, color = C.ink) {
    const k = E.inOut(prog(t, start, dur)); if (k <= 0) return '';
    const x = lerp(x1, x2, k), y = lerp(y1, y2, k), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return `<line x1="${x1}" y1="${y1}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="14" stroke-linecap="round"/>` + G({ x, y, r: a }, `<path d="M-10 -26 L26 0 L-10 26 Z" fill="${color}" stroke="${color}" stroke-width="6" stroke-linejoin="round"/>`);
  }
  // draws any path on, like a pen (pathLength trick)
  function drawOn(d, t, start, dur = 1, color = C.ink, width = 12, fill = 'none') {
    const k = E.inOut(prog(t, start, dur)); if (k <= 0) return '';
    return `<path d="${d}" pathLength="1" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="${k >= 1 ? fill : 'none'}" stroke-dasharray="1 1" stroke-dashoffset="${(1 - k).toFixed(4)}"/>`;
  }

  // ---------- text ----------
  // Arabic-safe text. rtl=true for Arabic. Outlined so it reads on any background.
  function text(x, y, str, size = 90, fill = C.white, anchor = 'middle', outline = true) {
    const ol = outline ? ` stroke="${C.ink}" stroke-width="${Math.round(size / 7)}" paint-order="stroke" stroke-linejoin="round"` : '';
    return `<text x="${x}" y="${y}" font-family="KidsFont" font-weight="800" font-size="${size}" fill="${fill}" text-anchor="${anchor}" direction="rtl" unicode-bidi="plaintext"${ol}>${esc(str)}</text>`;
  }
  // a title that bounces in at `start`
  function title(str, t, start = 0.2, y = 190, size = 110, fill = C.yellow) {
    const s = pop(t, start, 0.6); return G({ x: W / 2, y: y + bob(t, 5, 2.2), s }, text(0, 0, str, size, fill));
  }
  // speech bubble; tail points down-left by default (tail: 'left' | 'right' | 'none')
  function bubble(x, y, w, h, str, t, start = 0, size = 64, tail = 'left') {
    const s = pop(t, start, 0.45); if (!s) return '';
    const tl = tail === 'none' ? '' : tail === 'left' ? `<path d="M${-w / 2 + 60} ${h / 2 - 4} L${-w / 2 + 20} ${h / 2 + 70} L${-w / 2 + 130} ${h / 2 - 4} Z" fill="#fff" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>` : `<path d="M${w / 2 - 60} ${h / 2 - 4} L${w / 2 - 20} ${h / 2 + 70} L${w / 2 - 130} ${h / 2 - 4} Z" fill="#fff" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
    const cover = tail === 'none' ? '' : `<rect x="${tail === 'left' ? -w / 2 + 50 : w / 2 - 140}" y="${h / 2 - 14}" width="90" height="14" fill="#fff"/>`;
    return G({ x, y, s }, `${tl}<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(60, h / 2)}" fill="#fff" stroke="${C.ink}" stroke-width="7"/>${cover}${text(0, size * 0.35, str, size, C.ink, 'middle', false)}`);
  }

  // ---------- characters (original designs) ----------
  // NUNU — the show's mascot: a round friendly creature with a star antenna.
  // talk: true makes the mouth move. wave: true waves the right arm. mood: 'happy' | 'wow' | 'think'
  function mascot(o) {
    const t = o.t || 0, col = o.color || C.orange, mood = o.mood || 'happy';
    const squash = 1 + Math.sin(t * 4) * 0.025;
    const blink = (t % 3.3) > 3.15 ? 0.15 : 1;
    const open = o.talk ? (0.35 + 0.65 * Math.abs(Math.sin(t * 11))) : (mood === 'wow' ? 1 : 0);
    const look = o.look || 0; // -1 left .. 1 right
    const wave = o.wave ? Math.sin(t * 8) * 25 - 40 : 10;
    const mouth = mood === 'think'
      ? `<path d="M-25 70 Q 0 62 25 72" stroke="${C.ink}" stroke-width="9" fill="none" stroke-linecap="round"/>`
      : `<path d="M-45 55 Q 0 ${70 + 45 * open} 45 55 Z" fill="#7A1F2B" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/><ellipse cx="0" cy="${62 + 20 * open}" rx="${18 * open}" ry="${9 * open}" fill="${C.pink}"/>`;
    const eye = (ex) => `<g transform="translate(${ex} -10) scale(1 ${blink})"><ellipse rx="34" ry="42" fill="#fff" stroke="${C.ink}" stroke-width="6"/><circle cx="${look * 10}" cy="6" r="20" fill="${C.ink}"/><circle cx="${look * 10 + 8}" cy="-4" r="7" fill="#fff"/></g>`;
    const brows = mood === 'wow' ? `<path d="M-65 -75 Q -40 -95 -15 -78" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M65 -75 Q 40 -95 15 -78" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>` : '';
    const body =
      `<g transform="rotate(${bob(t, 6, 3)} 0 -175)"><path d="M0 -150 Q 6 -185 0 -215" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>${star(0, -230, 32, C.yellow)}</g>` +
      `<ellipse cx="0" cy="170" rx="110" ry="18" fill="#000" opacity=".12"/>` +
      `<g transform="rotate(${-10} -125 40)"><ellipse cx="-140" cy="40" rx="28" ry="55" fill="${col}" stroke="${C.ink}" stroke-width="7"/></g>` +
      `<g transform="rotate(${wave} 125 20)"><ellipse cx="150" cy="40" rx="28" ry="55" fill="${col}" stroke="${C.ink}" stroke-width="7"/></g>` +
      `<ellipse cx="-55" cy="150" rx="40" ry="24" fill="${col}" stroke="${C.ink}" stroke-width="7"/><ellipse cx="55" cy="150" rx="40" ry="24" fill="${col}" stroke="${C.ink}" stroke-width="7"/>` +
      `<ellipse cx="0" cy="10" rx="150" ry="150" fill="${col}" stroke="${C.ink}" stroke-width="8"/>` +
      `<ellipse cx="0" cy="55" rx="85" ry="70" fill="#fff" opacity=".35"/>` +
      eye(-48) + eye(48) + brows +
      `<circle cx="-95" cy="40" r="20" fill="${C.pink}" opacity=".55"/><circle cx="95" cy="40" r="20" fill="${C.pink}" opacity=".55"/>` + mouth;
    return G({ x: o.x || 0, y: (o.y || 0) + (o.hop ? -Math.abs(Math.sin(t * 5)) * 40 : 0), s: (o.s || 1), sx: 1 / squash, sy: squash }, body);
  }
  // a child character. girl: true adds pigtails. skin: index into C.skin or a color.
  function kid(o) {
    const t = o.t || 0, skin = typeof o.skin === 'number' ? C.skin[o.skin] : (o.skin || C.skin[1]);
    const hair = o.hair || '#3B2416', shirt = o.shirt || C.blue, pants = o.pants || '#3D405B';
    const blink = ((t + (o.x || 0) / 500) % 3.7) > 3.55 ? 0.15 : 1;
    const open = o.talk ? 0.3 + 0.7 * Math.abs(Math.sin(t * 11)) : 0;
    const wave = o.wave ? Math.sin(t * 8) * 30 - 120 : 15;
    const step = o.walk ? Math.sin(t * 9) * 18 : 0;
    const pig = o.girl ? `<circle cx="-78" cy="-215" r="30" fill="${hair}"/><circle cx="78" cy="-215" r="30" fill="${hair}"/>` : '';
    const body =
      `<ellipse cx="0" cy="185" rx="80" ry="14" fill="#000" opacity=".12"/>` +
      `<rect x="-38" y="60" width="30" height="${120 + step}" rx="14" fill="${pants}"/><rect x="8" y="60" width="30" height="${120 - step}" rx="14" fill="${pants}"/>` +
      `<g transform="rotate(${-15} -55 -40)"><rect x="-75" y="-50" width="26" height="110" rx="13" fill="${skin}" stroke="${C.ink}" stroke-width="5"/></g>` +
      `<g transform="rotate(${wave} 55 -40)"><rect x="49" y="-50" width="26" height="110" rx="13" fill="${skin}" stroke="${C.ink}" stroke-width="5"/></g>` +
      `<rect x="-62" y="-70" width="124" height="150" rx="40" fill="${shirt}" stroke="${C.ink}" stroke-width="6"/>` +
      pig + `<circle cx="0" cy="-160" r="85" fill="${skin}" stroke="${C.ink}" stroke-width="6"/>` +
      `<path d="M-85 -170 Q -80 -260 0 -250 Q 80 -260 85 -170 Q 40 -215 -85 -170 Z" fill="${hair}"/>` +
      `<g transform="translate(-30 -155) scale(1 ${blink})"><circle r="11" fill="${C.ink}"/><circle cx="4" cy="-4" r="4" fill="#fff"/></g><g transform="translate(30 -155) scale(1 ${blink})"><circle r="11" fill="${C.ink}"/><circle cx="4" cy="-4" r="4" fill="#fff"/></g>` +
      `<circle cx="-50" cy="-125" r="13" fill="${C.pink}" opacity=".5"/><circle cx="50" cy="-125" r="13" fill="${C.pink}" opacity=".5"/>` +
      `<path d="M-28 -115 Q 0 ${-95 + 25 * open} 28 -115 Z" fill="#7A1F2B" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`;
    return G({ x: o.x || 0, y: (o.y || 0) + (o.hop ? -Math.abs(Math.sin(t * 5)) * 35 : 0), s: o.s || 1, sx: o.flip ? -1 : 1 }, body);
  }

  // ---------- celebration ----------
  function confetti(t, start, seed = 7, n = 70) {
    if (t < start) return ''; const r = rand(seed), cols = [C.red, C.yellow, C.blue, C.green, C.pink, C.purple, C.orange]; let out = ''; const dt = t - start;
    for (let i = 0; i < n; i++) {
      const x0 = r() * W, vy = 250 + r() * 350, sw = r() * 6, c = cols[i % cols.length], sz = 14 + r() * 16;
      const y = -40 + dt * vy, x = x0 + Math.sin(dt * 3 + sw) * 60; if (y > H + 40) continue;
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${sz}" height="${sz * 0.55}" rx="3" fill="${c}" transform="rotate(${(dt * 200 + i * 37) % 360} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return out;
  }
  function sparkles(x, y, t, start = 0, spread = 140) {
    if (t < start) return ''; let out = ''; const dt = t - start;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3, d = spread * E.out(dt / 0.8), k = clamp(1 - dt / 1.2); if (k <= 0) break; out += star(x + Math.cos(a) * d, y + Math.sin(a) * d, 22 * k, C.yellow, k); }
    return out;
  }
  // a big happy tick ✓ that draws itself (for quiz answers)
  function tick(x, y, t, start, s = 1) { return G({ x, y, s }, drawOn('M-60 0 L-15 45 L70 -55', t, start, 0.5, C.green, 30)); }

  return { W, H, C, E, clamp, lerp, prog, pop, bob, rand, G, esc, sky, flat, hills, cloud, sun, starfield, star, heart, tree, palm, count, flower, house, drop, apple, balloon, badge, card, arrow, drawOn, text, title, bubble, mascot, kid, confetti, sparkles, tick };
})();
if (typeof module !== 'undefined') module.exports = K;
