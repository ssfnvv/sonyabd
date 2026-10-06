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
