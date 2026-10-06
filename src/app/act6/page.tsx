"use client";

// Акт 6, финал, три части:
// 1) «трейлер» — видео-поздравления друзей подряд, как в кино: чёрный экран, полосы сверху/снизу,
//    в углу от руки имя того, кто поздравляет; в конце титр;
// 2) баночка с предсказаниями — тап по банке, банка трясётся, вылетает записка;
// 3) последняя фраза и конфетти.
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, SkipForward, X } from "lucide-react";
import confetti from "canvas-confetti";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { mediaUrl } from "@/lib/media";
import { shuffle } from "@/lib/mix";
import { unlockAudio } from "@/lib/sound";
import { ActShell } from "@/components/acts/ActShell";
import { Jar } from "@/components/acts/Jar";
import { RansomText, hash } from "@/components/acts/RansomText";

const t = copy.act6;
type Video = { id: string; path: string; mime: string; name: string };
type Prediction = { id: string; text: string; name: string };
type Stage = "loading" | "trailer-ready" | "trailer" | "trailer-end" | "jar" | "ending";

const PINKS = ["#f9c5d5", "#e88aa8", "#d9628a", "#fde4ec", "#fff3e3", "#f6cf7a", "#ffffff"];

export default function Act6() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [stage, setStage] = useState<Stage>("loading");
  const demo = useRef(false);

  useEffect(() => {
    demo.current = new URLSearchParams(window.location.search).has("demo");
    (async () => {
      let data: { videos: Video[]; predictions: Prediction[] } = { videos: [], predictions: [] };
      if (demo.current) data = DEMO;
      else {
        try {
          const r = await fetch("/api/public/final");
          if (r.ok) data = await r.json();
        } catch {
          /* покажем то, что есть */
        }
      }
      setVideos(shuffle(data.videos));
      setPreds(shuffle(data.predictions));
      setStage(data.videos.length ? "trailer-ready" : data.predictions.length ? "jar" : "ending");
    })();
  }, []);

  const afterTrailer = useCallback(() => {
    setStage("trailer-end");
    setTimeout(() => setStage(preds.length ? "jar" : "ending"), 3800);
  }, [preds.length]);

  const dark = stage === "trailer-ready" || stage === "trailer" || stage === "trailer-end" || stage === "loading";

  return (
    <ActShell back="/act5" dark={dark} className={dark ? "bg-black" : "scrap-desk"}>
      {stage === "loading" && (
        <div className="grid min-h-dvh place-items-center">
          <div className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white/70" />
        </div>
      )}

      {(stage === "trailer-ready" || stage === "trailer") && (
        <Trailer videos={videos} started={stage === "trailer"} onStart={() => setStage("trailer")} onEnd={afterTrailer} />
      )}

      {/* финальный титр трейлера */}
      <AnimatePresence>
        {stage === "trailer-end" && (
          <motion.div
            key="end"
            className="grid min-h-dvh place-items-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div initial={{ scale: 1.25, filter: "blur(10px)" }} animate={{ scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.6, ease: "easeOut" }}>
              <RansomText text={t.trailerEnd} size={34} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === "jar" && <JarStage preds={preds} onEmpty={() => setStage("ending")} />}
      {stage === "ending" && <Ending />}
    </ActShell>
  );
}

// ---------- трейлер ----------
function Trailer({ videos, started, onStart, onEnd }: { videos: Video[]; started: boolean; onStart: () => void; onEnd: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(false);

  const next = useCallback(() => {
    setFade(true);
    setTimeout(() => {
      setFade(false);
      setI((n) => {
        if (n + 1 >= videos.length) {
          onEnd();
          return n;
        }
        return n + 1;
      });
    }, 450);
  }, [videos.length, onEnd]);

  // смена ролика: тот же <video>, новый src — так iPhone не просит нажимать «play» заново
  useEffect(() => {
    const v = ref.current;
    if (!v || !started) return;
    v.src = srcOf(videos[i]);
    v.play().catch(() => {
      /* если браузер не дал запустить — пропускаем ролик */
      next();
    });
  }, [i, started, videos, next]);

  const start = () => {
    unlockAudio();
    const v = ref.current;
    if (v) {
      // запуск прямо в обработчике нажатия — обязательно для iPhone
      v.src = srcOf(videos[0]);
      v.play().catch(() => {});
    }
    onStart();
  };

  const cur = videos[i];
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black">
      {/* кинополосы */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-[9dvh] bg-black" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[9dvh] bg-black" />

      <div className="relative w-full">
        <video
          ref={ref}
          playsInline
          preload="auto"
          onEnded={next}
          onError={() => started && next()}
          className="max-h-[78dvh] w-full bg-black object-contain transition-opacity duration-500"
          style={{ opacity: started && !fade ? 1 : 0 }}
        />
        {/* имя — «от руки» в углу */}
        <AnimatePresence mode="wait">
          {started && cur && !fade && (
            <motion.p
              key={cur.id}
              className="font-hand absolute bottom-4 left-5 text-[2.2rem] font-bold leading-none text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.8)]"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {cur.name}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {!started && (
        <motion.button
          onClick={start}
          aria-label="play"
          className="absolute grid size-24 place-items-center rounded-full border-2 border-white/70 bg-white/10 text-white backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
        >
          <Play className="size-10 translate-x-1 fill-current" />
        </motion.button>
      )}

      {started && (
        <>
          {/* полоска прогресса по роликам */}
          <div className="fixed inset-x-6 top-[calc(9dvh-14px)] z-20 flex gap-1">
            {videos.map((v, k) => (
              <span key={v.id} className="h-0.5 flex-1 rounded-full" style={{ background: k <= i ? "#f9c5d5" : "rgba(255,255,255,.25)" }} />
            ))}
          </div>
          <button onClick={next} aria-label="skip" className="fixed bottom-[calc(9dvh+12px)] right-4 z-20 grid size-11 place-items-center rounded-full bg-white/10 text-white/80 active:scale-90">
            <SkipForward className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}

function srcOf(v: Video) {
  return /^(data:|https?:|\/)/.test(v.path) ? v.path : mediaUrl(v.path);
}

// ---------- баночка с предсказаниями ----------
function JarStage({ preds, onEmpty }: { preds: Prediction[]; onEmpty: () => void }) {
  const [taken, setTaken] = useState(0);
  const [open, setOpen] = useState<Prediction | null>(null);
  const [shaking, setShaking] = useState(false);
  const left = preds.length - taken;

  const pull = () => {
    if (open || shaking || left <= 0) return;
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setOpen(preds[taken]);
      setTaken((n) => n + 1);
    }, 700);
  };

  const close = () => {
    setOpen(null);
    if (taken >= preds.length) setTimeout(onEmpty, 500);
  };

  const tilt = open ? (hash(open.id) - 0.5) * 6 : 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-8 pb-10 pt-20">
      <motion.button
        onClick={pull}
        aria-label="jar"
        className="w-[80%]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileTap={{ scale: 0.97 }}
      >
        <Jar count={left} shaking={shaking} />
      </motion.button>

      {/* развёрнутая записка */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 grid place-items-center bg-[#3a1f30]/30 px-6 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
            <motion.div
              className="relative w-full max-w-sm bg-[#fffdf6] px-7 pb-8 pt-9 shadow-[0_20px_40px_-12px_rgba(60,20,40,.5)]"
              style={{ rotate: `${tilt}deg` }}
              initial={{ y: 160, scaleY: 0.15, scaleX: 0.5, opacity: 0 }}
              animate={{ y: 0, scaleY: 1, scaleX: 1, opacity: 1 }}
              exit={{ y: -40, opacity: 0, rotate: tilt + 8 }}
              transition={{ type: "spring", damping: 15, stiffness: 140 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* сгибы бумаги */}
              <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-[#e9dfcf]" />
              <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-[#e9dfcf]" />
              <p className="font-hand relative whitespace-pre-wrap text-[1.7rem] font-bold leading-[1.2] text-[#4a2a36]">{open.text}</p>
              {open.name && <p className="font-hand relative mt-4 text-right text-[1.8rem] font-bold leading-none text-pink-deep">{open.name}</p>}
              <button onClick={close} aria-label="close" className="absolute -right-3 -top-3 grid size-10 place-items-center rounded-full bg-pink-deep text-white shadow-md active:scale-90">
                <X className="size-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- последняя фраза ----------
function Ending() {
  useEffect(() => {
    const opts = { colors: PINKS, disableForReducedMotion: true, scalar: 1.1 };
    confetti({ ...opts, particleCount: 160, spread: 110, startVelocity: 55, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ ...opts, particleCount: 80, angle: 60, spread: 65, origin: { x: 0, y: 0.75 } });
      confetti({ ...opts, particleCount: 80, angle: 120, spread: 65, origin: { x: 1, y: 0.75 } });
    }, 400);
    // мягкий конфетти-дождь, пока Соня на экране
    let alive = true;
    const rain = () => {
      if (!alive) return;
      confetti({ ...opts, particleCount: 2, startVelocity: 0, gravity: 0.5, ticks: 400, spread: 180, origin: { x: Math.random(), y: -0.05 } });
      setTimeout(rain, 260);
    };
    const id = setTimeout(rain, 1200);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, []);

  const words = t.ending.split(" ");
  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#fde4ec_45%,#f9c5d5_100%)] px-7">
      <p className="text-balance text-center font-display text-[2rem] font-bold leading-snug text-rose-ink">
        {words.map((w, i) => (
          <span key={i}>
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5 + i * 0.16, duration: 0.5 }}
            >
              {w}
            </motion.span>{" "}
          </span>
        ))}
      </p>
    </div>
  );
}

// ---------- демо ----------
const DEMO = {
  // демо-ролики: цветные градиенты с тоном вместо настоящих поздравлений
  videos: [
    { id: "v1", path: "/demo/f9c5d5.mp4", mime: "video/mp4", name: "…" },
    { id: "v2", path: "/demo/f6cf7a.mp4", mime: "video/mp4", name: "…" },
  ] as Video[],
  predictions: [
    { id: "p1", text: "…", name: "…" },
    { id: "p2", text: "…", name: "…" },
    { id: "p3", text: "…", name: "…" },
  ],
};
