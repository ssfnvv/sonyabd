"use client";

// Акт 3: «микстейп». Голосовые друзей (тип «радио») в случайном порядке склеены в один эфир.
// Кассета крутится, на наклейке — имя того, кто говорит; ниже волна звука (по ней можно
// перематывать) и трек-лист на тетрадном листке.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { loadClips, mixPeaks, MixPlayer, shuffle, type MixClip, type RawClip } from "@/lib/mix";
import { getAudioContext, unlockAudio } from "@/lib/sound";
import { assetUrl, ASSETS } from "@/content/assets";
import { ActShell } from "@/components/acts/ActShell";
import { Cassette } from "@/components/acts/Cassette";
import { cn, fmtTime } from "@/components/ui";

const t = copy.act3;
const BARS = 56;

export default function Act3() {
  const [clips, setClips] = useState<MixClip[] | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const player = useRef<MixPlayer | null>(null);

  // загрузка и декодирование голосовых
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let raw: RawClip[];
      if (new URLSearchParams(window.location.search).has("demo")) {
        const c = await demoClips();
        if (!cancelled) setClips(c);
        return;
      }
      try {
        raw = await fetch("/api/public/audios?type=diary").then((r) => (r.ok ? r.json() : []));
      } catch {
        raw = [];
      }
      raw = shuffle(raw);
      setTotal(raw.length);
      const c = await loadClips(raw, (n) => !cancelled && setLoaded(n));
      if (!cancelled) setClips(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clips) return;
    const p = new MixPlayer(clips);
    player.current = p;
    return () => p.dispose();
  }, [clips]);

  // обновление позиции ~30 раз в секунду
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = player.current;
      if (p) {
        const now = p.position();
        setPos(now);
        if (p.playing && now >= p.total - 0.02) {
          p.finish();
          setPlaying(false);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const peaks = useMemo(() => (clips ? mixPeaks(clips, BARS) : []), [clips]);
  const duration = player.current?.total ?? 0;
  const current = clips && clips.length ? player.current?.clipAt(pos) ?? 0 : -1;

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p || !clips?.length) return;
    unlockAudio();
    if (p.playing) p.pause();
    else p.play();
    setPlaying(p.playing);
  }, [clips]);

  const jump = (i: number) => {
    const p = player.current;
    if (!p || !clips?.length) return;
    unlockAudio();
    const idx = Math.max(0, Math.min(clips.length - 1, i));
    p.seek(clips[idx].start);
    if (!p.playing) {
      p.play(clips[idx].start);
      setPlaying(true);
    }
  };

  const seekTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = player.current;
    if (!p || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    p.seek(((e.clientX - r.left) / r.width) * duration);
    setPos(p.position());
  };

  const progress = duration ? pos / duration : 0;
  const loading = clips === null;
  const tape = ASSETS["tape"] ? assetUrl("tape") : null;

  return (
    <ActShell back="/act2" className="scrap-desk">
      <div className="mx-auto flex max-w-md flex-col items-center gap-7 px-5 pb-20 pt-20">
        {/* кассета */}
        <motion.div
          className="relative w-full"
          initial={{ y: -40, opacity: 0, rotate: -6 }}
          animate={{ y: 0, opacity: 1, rotate: -2 }}
          transition={{ type: "spring", damping: 14 }}
        >
          {tape && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tape} alt="" className="pointer-events-none absolute -top-4 left-1/2 z-10 w-[40%] -translate-x-1/2 rotate-[4deg]" />
          )}
          <Cassette progress={loading ? 0.35 : progress} playing={playing || loading} label={current >= 0 ? clips?.[current]?.name : undefined} />
        </motion.div>

        {/* загрузка */}
        {loading && (
          <div className="flex w-full flex-col items-center gap-2">
            <div className="h-2 w-2/3 overflow-hidden rounded-full bg-pink-soft">
              <motion.div
                className="h-full rounded-full bg-pink-deep"
                animate={{ width: total ? `${(loaded / total) * 100}%` : ["10%", "60%", "10%"] }}
                transition={total ? { duration: 0.3 } : { duration: 1.6, repeat: Infinity }}
              />
            </div>
          </div>
        )}

        {/* волна + время */}
        {!loading && clips!.length > 0 && (
          <>
            <div className="w-full">
              <div className="flex h-16 w-full cursor-pointer touch-none items-center gap-[2px]" onPointerDown={seekTo}>
                {peaks.map((v, i) => {
                  const done = (i + 0.5) / BARS <= progress;
                  return (
                    <span
                      key={i}
                      className={cn("flex-1 rounded-full transition-colors duration-150", done ? "bg-pink-deep" : "bg-[#efc3d1]")}
                      style={{ height: `${v * 100}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs font-semibold tabular-nums text-rose-ink/60">
                <span>{fmtTime(pos)}</span>
                <span>{fmtTime(duration)}</span>
              </div>
            </div>

            {/* кнопки */}
            <div className="flex items-center gap-6">
              <button onClick={() => jump(current - 1)} aria-label="prev" className="grid size-12 place-items-center rounded-full bg-white/80 ring-2 ring-pink active:scale-90">
                <SkipBack className="size-5 fill-current" />
              </button>
              <motion.button
                onClick={toggle}
                aria-label={playing ? "pause" : "play"}
                whileTap={{ scale: 0.92 }}
                className="grid size-20 place-items-center rounded-full bg-pink-deep text-white shadow-[0_6px_0_#c9688a]"
              >
                {playing ? <Pause className="size-8 fill-current" /> : <Play className="size-8 translate-x-0.5 fill-current" />}
              </motion.button>
              <button onClick={() => jump(current + 1)} aria-label="next" className="grid size-12 place-items-center rounded-full bg-white/80 ring-2 ring-pink active:scale-90">
                <SkipForward className="size-5 fill-current" />
              </button>
            </div>

            {/* трек-лист на тетрадном листке */}
            <motion.div
              className="relative w-[92%] rotate-[1.5deg] drop-shadow-[0_8px_10px_rgba(90,30,50,.22)]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {tape && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tape} alt="" className="pointer-events-none absolute -top-4 left-[8%] z-10 w-[34%] -rotate-[8deg]" />
              )}
              {/* тетрадный листок: линейки и поля рисуются CSS — растягивается под любое число имён */}
              <ol
                className="notebook-page relative py-6 pl-14 pr-5"
              >
                {clips!.map((c, i) => (
                  <li key={c.id}>
                    <button
                      onClick={() => jump(i)}
                      className={cn(
                        "flex h-[2.2rem] w-full items-end gap-2 pb-[3px] text-left font-hand text-[1.55rem] font-bold leading-none",
                        i === current ? "text-pink-deep" : "text-[#4a2a36]/75",
                      )}
                    >
                      <span className="w-6 shrink-0 text-right text-[1.1rem] opacity-60">{i + 1}.</span>
                      <span className={cn("truncate", i === current && playing && "underline decoration-wavy decoration-2 underline-offset-4")}>
                        {c.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </motion.div>
          </>
        )}

        {!loading && (
          <Link
            href="/act4"
            onClick={() => player.current?.pause()}
            className="mt-2 inline-block rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]"
          >
            {t.next}
          </Link>
        )}
      </div>
    </ActShell>
  );
}

// ---------- демо: синтезированные «голоса» вместо настоящих записей ----------
async function demoClips(): Promise<MixClip[]> {
  const ctx = getAudioContext();
  const out: MixClip[] = [];
  let start = 0;
  for (let i = 0; i < 5; i++) {
    const dur = 4 + i;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    const f = 180 + i * 40;
    for (let k = 0; k < d.length; k++) {
      const tt = k / ctx.sampleRate;
      // «слоги»: тон с огибающей, похожей на речь
      const env = Math.max(0, Math.sin(tt * Math.PI * (2.2 + i * 0.3))) * (0.6 + 0.4 * Math.sin(tt * 1.3));
      d[k] = Math.sin(2 * Math.PI * f * tt) * env * 0.25;
    }
    out.push({ id: `demo${i}`, name: "…", start, dur, buffer: b });
    start += dur + 0.9;
  }
  return out;
}
