// THE VIDEO. Replace this example with scenes made from the PDF.
// Each scene: dur (seconds), narration (what Nunu says, Iraqi Arabic),
// subs (the same narration cut into 1-3 short lines, shown in order),
// sfx (optional: [{at: seconds, type: 'pop'|'whoosh'|'ding'|'boing'|'cheer'|'twinkle'}]),
// draw(t, d) -> SVG string for local time t (0..d). Use only K.* helpers and plain SVG.
var VIDEO = {
  title: 'الشمس صديقتنا',
  lang: 'ar',            // 'ar' or 'en' — subtitles direction + speech voice
  subtitles: true,
  scenes: [
    {
      dur: 8,
      narration: 'هلا حبايبي! آني نونو. اليوم راح نتعرف على صديقة كلش حلوة… الشمس!',
      subs: ['هلا حبايبي! آني نونو', 'اليوم راح نتعرف على صديقة كلش حلوة… الشمس!'],
      sfx: [{ at: 0.3, type: 'boing' }, { at: 4.2, type: 'twinkle' }],
      draw: (t, d) =>
        K.sky(t) + K.cloud(300, 200, 1, t) + K.cloud(1300, 140, 0.8, t, 8) + K.hills(t) +
        K.G({ s: K.pop(t, 4, 0.8) }, K.sun(1500, 280, 1, t)) +
        K.mascot({ x: 760, y: 640, s: K.pop(t, 0.2), t, talk: t < d - 0.5, wave: t < 3, look: t > 4 ? 1 : 0 }) +
        K.title('الشمس صديقتنا', t, 1.2, 170),
    },
    {
      dur: 9,
      narration: 'الشمس تنطينا ضوء حتى نشوف، وتدفينا، وتخلي الورد يكبر.',
      subs: ['الشمس تنطينا ضوء حتى نشوف', 'وتدفينا، وتخلي الورد يكبر'],
      sfx: [{ at: 0.6, type: 'pop' }, { at: 3.2, type: 'pop' }, { at: 5.8, type: 'pop' }],
      draw: (t, d) => {
        const grow = K.E.out(K.prog(t, 5.8, 2));
        return K.sky(t) + K.hills(t) + K.sun(960, 250, 0.9, t) +
          K.card(480, 560, 340, 300, K.C.white, K.G({ s: K.pop(t, 0.6) }, K.star(0, -10, 80, K.C.yellow))) +
          K.card(960, 560, 340, 300, K.C.white, K.G({ s: K.pop(t, 3.2) }, K.heart(0, 0, 2.2, K.C.orange))) +
          K.card(1440, 560, 340, 300, K.C.white, K.G({ s: grow, y: 90 }, K.flower(0, -110, 1, t))) +
          K.mascot({ x: 220, y: 880, s: 0.6, t, talk: true, look: 1 });
      },
    },
    {
      dur: 9,
      narration: 'سؤال! الشمس تطلع بالليل لو بالنهار؟ … صح! بالنهار. عفية عليكم!',
      subs: ['سؤال! الشمس تطلع بالليل لو بالنهار؟', 'صح! بالنهار. عفية عليكم!'],
      sfx: [{ at: 0.3, type: 'ding' }, { at: 5.2, type: 'cheer' }],
      draw: (t, d) => {
        const reveal = t > 5.2;
        return K.flat('#FFF1C9') +
          K.title('سؤال!', t, 0.2, 170, 120, K.C.orange) +
          K.card(620, 560, 460, 360, reveal ? '#DFF7E8' : K.C.white, K.G({ s: K.pop(t, 1) }, K.sun(0, -20, 0.75, t)) + K.text(0, 140, 'النهار', 70, K.C.ink, 'middle', false)) +
          K.card(1300, 560, 460, 360, '#2B2D6B', K.G({ s: K.pop(t, 1.4) }, K.starfield(t, 0) + `<circle cx="-10" cy="-30" r="80" fill="#FFF6B0"/><circle cx="25" cy="-50" r="70" fill="#2B2D6B"/>`) + K.text(0, 140, 'الليل', 70, K.C.white, 'middle', false)) +
          (reveal ? K.tick(780, 420, t, 5.2, 1.3) + K.sparkles(620, 560, t, 5.2, 260) : '') +
          K.mascot({ x: 960, y: 900, s: 0.5, t, talk: true, mood: reveal ? 'wow' : 'think', hop: reveal }) +
          K.confetti(t, 5.3);
      },
    },
    {
      dur: 7,
      narration: 'شفتوا شكد الشمس حلوة؟ باي باي حبايبي، نشوفكم بالدرس الجاي!',
      subs: ['شفتوا شكد الشمس حلوة؟', 'باي باي حبايبي، نشوفكم بالدرس الجاي!'],
      sfx: [{ at: 3.5, type: 'twinkle' }],
      draw: (t, d) =>
        K.sky(t, '#FFB4A2', '#FFE5D9') + K.sun(1500, 700 - 200 * (1 - t / d), 1, t) + K.hills(t, 840) +
        K.balloon(300, 400, 1, t, K.C.purple) + K.balloon(450, 330, 0.8, t, K.C.blue) +
        K.mascot({ x: 960, y: 640, t, talk: t < d - 0.8, wave: t > 3, hop: t > 5 }) +
        K.title('باي باي!', t, 3.5, 170, 120, K.C.white),
    },
  ],
};
if (typeof module !== 'undefined') module.exports = VIDEO;
