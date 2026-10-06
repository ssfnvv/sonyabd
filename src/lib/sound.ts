"use client";

// Общий AudioContext на всё прохождение. iPhone разрешает звук только после касания,
// поэтому unlockAudio() вызывается по нажатию «войти» — и дальше звук работает во всех актах.
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) {
    // iPhone по умолчанию глушит веб-звук беззвучным режимом. Просим режим «воспроизведение»,
    // как у музыки и видео (поддерживается в iOS 16.4+)
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {
        /* не поддерживается — ничего страшного */
      }
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio() {
  const c = getAudioContext();
  if (c.state === "suspended") c.resume();
  // короткий беззвучный буфер — окончательно «будит» звук на iOS
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
}

// Звонок старого телефона: два «колокольчика» с быстрой дрожью, ~1.4 секунды
export function playRing() {
  const c = getAudioContext();
  if (c.state === "suspended") c.resume();
  const now = c.currentTime;
  const dur = 1.4;
  const out = c.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(0.16, now + 0.02);
  out.gain.setValueAtTime(0.16, now + dur - 0.1);
  out.gain.linearRampToValueAtTime(0, now + dur);
  out.connect(c.destination);
  // дрожь молоточка между чашками звонка
  const trem = c.createGain();
  trem.gain.value = 0.5;
  const lfo = c.createOscillator();
  lfo.frequency.value = 22;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.5;
  lfo.connect(lfoGain).connect(trem.gain);
  trem.connect(out);
  for (const f of [1046, 1318, 2093]) {
    const o = c.createOscillator();
    o.type = f > 2000 ? "sine" : "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = f > 2000 ? 0.15 : 0.5;
    o.connect(g).connect(trem);
    o.start(now);
    o.stop(now + dur);
  }
  lfo.start(now);
  lfo.stop(now + dur);
}

// Короткий «клик» трубки
export function playClick() {
  const c = getAudioContext();
  const now = c.currentTime;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3 * 0.6;
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(now);
}

// Проиграть один буфер; возвращает функцию остановки
export function playBuffer(buf: AudioBuffer, onEnded?: () => void): () => void {
  const c = getAudioContext();
  if (c.state === "suspended") c.resume();
  const s = c.createBufferSource();
  s.buffer = buf;
  s.connect(c.destination);
  let stopped = false;
  s.onended = () => {
    if (!stopped) onEnded?.();
  };
  s.start();
  return () => {
    stopped = true;
    try {
      s.stop();
    } catch {
      /* уже остановлен */
    }
    s.disconnect();
  };
}

// «Дзынь»: синтезируем колокольчик, без аудиофайлов
export function playDing() {
  const c = getAudioContext();
  if (c.state === "suspended") c.resume();
  const now = c.currentTime;
  const master = c.createGain();
  master.gain.value = 0.35;
  master.connect(c.destination);

  // несколько обертонов с разным затуханием дают звук стеклянного колокольчика
  const partials = [
    { f: 1318.5, g: 0.5, d: 2.2 }, // E6
    { f: 2637, g: 0.18, d: 1.2 },
    { f: 3955, g: 0.08, d: 0.7 },
    { f: 1975.5, g: 0.22, d: 1.6 }, // B6
  ];
  for (const p of partials) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = p.f;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(p.g, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
    osc.connect(g).connect(master);
    osc.start(now);
    osc.stop(now + p.d + 0.05);
  }
}
