# Soundtrack: cheerful kids music + sound effects + (optional) voice files, from build/timeline.json.
# usage: python3 audio.py            -> build/audio.wav and build/audio.mp3
#        python3 audio.py --no-music -> effects and voice only
import json, os, subprocess, sys
import numpy as np

P = os.path.dirname(os.path.abspath(__file__)); SR = 44100
tl = json.load(open(os.path.join(P, 'build/timeline.json')))
D = tl['duration'] + 0.3; N = int(D * SR)
music = np.zeros((N, 2)); fx = np.zeros((N, 2)); voice = np.zeros(N)
rng = np.random.default_rng(11)

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d); return e
def add(buf, t, sig, gain=1.0, pan=0.0):
    i = int(t * SR);
    if i >= len(buf) or i < 0: return
    sig = sig[: len(buf) - i]
    if buf.ndim == 1: buf[i:i + len(sig)] += sig * gain; return
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    buf[i:i + len(sig), 0] += sig * gain * l; buf[i:i + len(sig), 1] += sig * gain * r
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tone(f, dur, harm=(1, .5, .25), a=0.005, d=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm)); return s * env(n, a, d)
def pluck(f, dur=0.5): return tone(f, dur, (1, .6, .35, .2, .1), 0.002, 0.18)
def glock(f, dur=1.0): return tone(f, dur, (1, 0, .3, 0, 0, .12), 0.001, 0.35)
def noise(dur, d=0.05):
    n = int(dur * SR); return rng.standard_normal(n) * env(n, 0.001, d)
def kick():
    n = int(0.3 * SR); t = np.arange(n) / SR; f = 120 * np.exp(-t * 25) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)

# ---------------- music: C major, 112 bpm, C G Am F ----------------
if '--no-music' not in sys.argv:
    beat = 60 / 112; bar = beat * 4
    chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
    melody_bank = [[72, 74, 76, 79, 76, 74, 72, 67], [71, 72, 74, 71, 67, 69, 71, 74], [72, 76, 74, 72, 69, 72, 76, 74], [69, 72, 77, 76, 74, 72, 69, 67]]
    nb = int(D / bar) + 1
    for b in range(nb):
        t0 = 0.4 + b * bar; ch = chords[b % 4]
        if t0 > D: break
        add(music, t0, tone(hz(ch[0] - 24), bar * 0.9, (1, .3), 0.01, 0.6), 0.32)            # bass
        for k in range(8):                                                                   # ukulele-ish strum on the eighths
            n = ch[k % 3] + (12 if k % 4 == 3 else 0); add(music, t0 + k * beat / 2, pluck(hz(n)), 0.13, -0.3 + 0.6 * (k % 2))
        if b >= 1:                                                                           # glockenspiel tune after the first bar
            mel = melody_bank[(b // 2) % 4]
            for k, m in enumerate(mel):
                if (k + b) % 5 == 4: continue
                add(music, t0 + k * beat / 2, glock(hz(m)), 0.10, 0.25)
        for k in range(4):                                                                    # soft kick + shaker
            add(music, t0 + k * beat, kick(), 0.35)
            add(music, t0 + k * beat + beat / 2, noise(0.08, 0.03), 0.05, 0.4)

# ---------------- sound effects ----------------
def sfx(kind):
    if kind == 'pop':
        n = int(.15 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (400 + 1400 * t / .15) * t) * env(n, .001, .04)
    if kind == 'boing':
        n = int(.6 * SR); t = np.arange(n) / SR; f = 180 + 120 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .25)
    if kind == 'whoosh':
        n = int(.5 * SR); w = rng.standard_normal(n); w = np.convolve(w, np.ones(30) / 30, 'same'); return w * np.sin(np.pi * np.arange(n) / n) ** 2 * 1.8
    if kind == 'ding': return glock(hz(84), 1.2) + 0.6 * glock(hz(91), 1.2)
    if kind == 'twinkle':
        out = np.zeros(int(1.2 * SR))
        for k, m in enumerate([84, 88, 91, 96, 100]): s = glock(hz(m), .6); i = int(k * .09 * SR); out[i:i + len(s)] += s[: len(out) - i] * .6
        return out
    if kind == 'cheer':
        out = np.zeros(int(1.6 * SR))
        for k, m in enumerate([72, 76, 79, 84]): s = tone(hz(m), .9, (1, .5, .3), .005, .4); i = int(k * .1 * SR); out[i:i + len(s)] += s[: len(out) - i] * .5
        out += noise(1.6, .5) * .12; return out
    return np.zeros(10)

for i, s in enumerate(tl['scenes']):
    if i > 0: add(fx, s['start'] - 0.05, sfx('whoosh'), 0.18)
    for e in s.get('sfx', []): add(fx, s['start'] + float(e.get('at', 0)), sfx(e.get('type', 'pop')), 0.35, float(e.get('pan', 0)))

# ---------------- voice ----------------
for s in tl['scenes']:
    if not s.get('voice'): continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', s['voice'], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.float32).astype(float)
    pk = np.max(np.abs(v)) or 1; add(voice, s['start'] + tl['voiceLead'], v / pk * 0.9)

# duck the music under the voice so the words stay clear for small kids
if np.any(voice):
    e = np.convolve(np.abs(voice), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); e = np.clip(e / (e.max() or 1) * 4, 0, 1)
    music *= (1 - 0.65 * e)[:, None]

mix = music * 0.8 + fx + np.stack([voice, voice], 1)
f = int(1.0 * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]
mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
wav = os.path.join(P, 'build/audio.wav'); pcm = (mix * 32767).astype('<i2').tobytes()
import wave
with wave.open(wav, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-b:a', '128k', os.path.join(P, 'build/audio.mp3')], check=True)
print(f'build/audio.wav + audio.mp3 — {D:.1f}s, voice: {"yes" if np.any(voice) else "no (browser speech will read the narration)"}')
