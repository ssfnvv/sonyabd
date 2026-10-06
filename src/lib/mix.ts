"use client";

// «Микстейп»: голосовые друзей склеены в один непрерывный эфир через Web Audio.
// Между голосами — короткий щелчок и шипение плёнки. Поддерживает паузу и перемотку.
import { getAudioContext } from "./sound";
import { mediaUrl } from "./media";

export type MixClip = { id: string; name: string; start: number; dur: number; buffer: AudioBuffer };
export type RawClip = { id: string; path: string; name: string };

const GAP = 0.9; // секунд «плёнки» между голосами

export async function loadClips(raw: RawClip[], onProgress?: (done: number) => void): Promise<MixClip[]> {
  const ctx = getAudioContext();
  let done = 0;
  const decoded = await Promise.all(
    raw.map(async (c) => {
      try {
        const buf = await fetch(mediaUrl(c.path)).then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.arrayBuffer();
        });
        // старый Safari умеет decodeAudioData только с колбэками
        const audio = await new Promise<AudioBuffer>((res, rej) => ctx.decodeAudioData(buf, res, rej));
        return { ...c, buffer: audio };
      } catch (e) {
        console.warn("clip skipped", c.id, e);
        return null;
      } finally {
        onProgress?.(++done);
      }
    }),
  );
  let t = 0;
  const out: MixClip[] = [];
  for (const d of decoded) {
    if (!d) continue;
    out.push({ id: d.id, name: d.name, start: t, dur: d.buffer.duration, buffer: d.buffer });
    t += d.buffer.duration + GAP;
  }
  return out;
}

export const mixDuration = (clips: MixClip[]) =>
  clips.length ? clips[clips.length - 1].start + clips[clips.length - 1].dur : 0;

// Пики громкости для волны: bars столбиков на всю длину эфира, значения 0..1
export function mixPeaks(clips: MixClip[], bars: number): number[] {
  const total = mixDuration(clips);
  if (!total) return Array(bars).fill(0.05);
  const out = Array(bars).fill(0.04);
  for (let i = 0; i < bars; i++) {
    const t0 = (i / bars) * total;
    const t1 = ((i + 1) / bars) * total;
    for (const c of clips) {
      const a = Math.max(t0, c.start) - c.start;
      const b = Math.min(t1, c.start + c.dur) - c.start;
      if (b <= a) continue;
      const data = c.buffer.getChannelData(0);
      const sr = c.buffer.sampleRate;
      const from = Math.floor(a * sr);
      const to = Math.min(data.length, Math.floor(b * sr));
      const step = Math.max(1, Math.floor((to - from) / 400));
      let sum = 0;
      let n = 0;
      for (let k = from; k < to; k += step) {
        sum += data[k] * data[k];
        n++;
      }
      out[i] = Math.max(out[i], Math.sqrt(sum / Math.max(1, n)));
    }
  }
  const max = Math.max(...out, 0.0001);
  return out.map((v) => Math.max(0.06, Math.min(1, (v / max) ** 0.7)));
}

// Буфер «плёночного» шума с щелчком в начале — звучит между голосами
let hissBuf: AudioBuffer | null = null;
function hiss(ctx: AudioContext): AudioBuffer {
  if (hissBuf) return hissBuf;
  const len = Math.floor(ctx.sampleRate * GAP);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    // мягкий розоватый шум, нарастает и затихает
    last = 0.97 * last + 0.03 * (Math.random() * 2 - 1);
    const env = Math.sin(Math.PI * t) * 0.35;
    d[i] = last * env * 4;
    // щелчок кнопки магнитофона в самом начале
    if (i < ctx.sampleRate * 0.012) d[i] += (Math.random() * 2 - 1) * 0.5 * (1 - i / (ctx.sampleRate * 0.012));
  }
  hissBuf = b;
  return b;
}

export class MixPlayer {
  private ctx = getAudioContext();
  private sources: AudioBufferSourceNode[] = [];
  private startedAt = 0; // ctx.currentTime, соответствующий позиции 0
  private pausedAt = 0;
  playing = false;
  readonly total: number;
  private gain: GainNode;

  constructor(private clips: MixClip[]) {
    this.total = mixDuration(clips);
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
  }

  position(): number {
    if (!this.playing) return this.pausedAt;
    return Math.min(this.total, this.ctx.currentTime - this.startedAt);
  }

  // индекс клипа, который звучит (или ближайший следующий) в момент t
  clipAt(t: number): number {
    for (let i = this.clips.length - 1; i >= 0; i--) if (t >= this.clips[i].start - 0.05) return i;
    return 0;
  }

  play(from = this.pausedAt) {
    this.stopSources();
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (from >= this.total) from = 0;
    const now = this.ctx.currentTime + 0.05;
    this.startedAt = now - from;
    this.clips.forEach((c, i) => {
      const end = c.start + c.dur;
      if (end > from) {
        const s = this.ctx.createBufferSource();
        s.buffer = c.buffer;
        s.connect(this.gain);
        const offset = Math.max(0, from - c.start);
        s.start(now + Math.max(0, c.start - from), offset);
        this.sources.push(s);
      }
      // шипение перед каждым следующим голосом
      const gapStart = end;
      if (i < this.clips.length - 1 && gapStart + GAP > from) {
        const h = this.ctx.createBufferSource();
        h.buffer = hiss(this.ctx);
        h.connect(this.gain);
        h.start(now + Math.max(0, gapStart - from), Math.max(0, from - gapStart));
        this.sources.push(h);
      }
    });
    this.playing = true;
  }

  pause() {
    this.pausedAt = this.position();
    this.stopSources();
    this.playing = false;
  }

  seek(t: number) {
    const to = Math.max(0, Math.min(this.total, t));
    if (this.playing) this.play(to);
    else this.pausedAt = to;
  }

  // конец эфира: возвращаем в начало
  finish() {
    this.stopSources();
    this.playing = false;
    this.pausedAt = 0;
  }

  dispose() {
    this.stopSources();
    this.gain.disconnect();
  }

  private stopSources() {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* уже остановлен */
      }
      s.disconnect();
    });
    this.sources = [];
  }
}

// Случайный порядок
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
