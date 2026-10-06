"use client";

// Акт 1: таймер до 00:00 8 октября. В полночь — «дзынь», конфетти, фон из ночного
// становится розовым, появляется надпись и кнопка дальше.
// Если Соня открыла сайт уже после полуночи — сразу праздничное состояние.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { copy } from "@/content/copy";
import { getTarget } from "@/lib/birthday";
import { playDing, unlockAudio } from "@/lib/sound";
import { ActShell } from "@/components/acts/ActShell";

const t = copy.act1;
const PINKS = ["#f9c5d5", "#e88aa8", "#d9628a", "#fde4ec", "#fff3e3", "#f6cf7a", "#ffffff"];

function burst() {
  const opts = { colors: PINKS, disableForReducedMotion: true, ticks: 260, scalar: 1.1 };
  confetti({ ...opts, particleCount: 140, spread: 100, startVelocity: 55, origin: { y: 0.65 } });
  // ещё две волны с боков
  setTimeout(() => {
    confetti({ ...opts, particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
    confetti({ ...opts, particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
  }, 350);
  // и мягкий «дождь» сверху пару секунд
  const end = Date.now() + 2500;
  const rain = () => {
    confetti({ ...opts, particleCount: 4, startVelocity: 0, gravity: 0.6, spread: 180, origin: { x: Math.random(), y: -0.05 } });
    if (Date.now() < end) requestAnimationFrame(rain);
  };
  setTimeout(rain, 700);
}

export default function Act1() {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null); // миллисекунд до полуночи
  const [celebrating, setCelebrating] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const target = getTarget();
    const update = () => {
      const ms = target - Date.now();
      setLeft(Math.max(0, ms));
      if (ms <= 0 && !firedRef.current) {
        firedRef.current = true;
        setCelebrating(true);
        playDing();
        setTimeout(burst, 150);
      }
    };
    update();
    // тикаем часто, чтобы секунда менялась ровно, без «прыжков»
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, []);

  if (left === null) return <main className="min-h-dvh bg-[#1f1019]" />;

  const total = Math.ceil(left / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <ActShell back="/" dark={!celebrating}>
      {/* Ночной фон, который в полночь растворяется в розовом */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#3a1f30_0%,#1f1019_55%,#140a10_100%)]" />
      <motion.div
        className="fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#fde4ec_40%,#f9c5d5_100%)]"
        initial={false}
        animate={{ opacity: celebrating ? 1 : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-10 px-6 text-center">
        <AnimatePresence mode="wait">
          {!celebrating ? (
            <motion.div
              key="countdown"
              className="flex flex-col items-center gap-8"
              exit={{ scale: 1.3, opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-display text-lg text-[#fde4ec]/80">{t.countdownLabel}</p>
              <div className="flex items-start gap-3 font-display text-[#fde4ec]">
                {(
                  [
                    [h, t.units.h],
                    [m, t.units.m],
                    [s, t.units.s],
                  ] as const
                ).map(([v, label], i) => (
                  <div key={label} className="flex items-start gap-3">
                    {i > 0 && <span className="pt-2 text-5xl text-[#f9c5d5]/50">:</span>}
                    <div className="flex flex-col items-center gap-2">
                      <motion.span
                        key={v}
                        initial={{ y: -10, opacity: 0.4 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="min-w-[2ch] text-6xl font-bold tabular-nums drop-shadow-[0_0_18px_#f9c5d566]"
                      >
                        {pad(v)}
                      </motion.span>
                      <span className="text-xs text-[#fde4ec]/50">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="party"
              className="flex flex-col items-center gap-10"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 120, delay: 0.3 }}
            >
              <h1 className="text-balance font-display text-4xl font-bold leading-tight text-rose-ink">{t.midnight}</h1>
              <motion.button
                onClick={() => {
                  unlockAudio();
                  router.push("/act2");
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                whileTap={{ scale: 0.94 }}
                className="rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a]"
              >
                {t.next}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ActShell>
  );
}
