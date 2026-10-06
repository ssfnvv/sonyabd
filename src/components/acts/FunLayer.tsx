"use client";

// «Весёлый слой» поверх каждого акта:
//  • время от времени появляется зверёк-дудл: черепаха/лев/слон/жираф/крокодил топают по низу,
//    волк несётся, котик прыгает дугами, бабочка и стрекоза пролетают, ленивец свисает сверху,
//    коала и котик выглядывают из угла;
//  • на каждое касание из-под пальца разлетаются переливающиеся Y2K-звёздочки;
//  • в углах тихо мерцают хромированные блёстки.
// Слой не мешает нажатиям (pointer-events: none).
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from "framer-motion";
import { assetUrl } from "@/content/assets";

// ---------- зверушки-дудлы (линейные рисунки, вырезаны из картинки владелицы) ----------
// Почти все нарисованы мордочкой влево; когда идут вправо — отражаем.
type Mode = "walk" | "run" | "leap" | "fly" | "dart" | "hang" | "peek";
const CRITTERS: { id: string; mode: Mode; h: number; dur: number }[] = [
  { id: "doodle-turtle", mode: "walk", h: 64, dur: 16 },
  { id: "doodle-lion", mode: "walk", h: 78, dur: 11 },
  { id: "doodle-elephant", mode: "walk", h: 82, dur: 13 },
  { id: "doodle-giraffe", mode: "walk", h: 128, dur: 12 },
  { id: "doodle-croc", mode: "walk", h: 52, dur: 12 },
  { id: "doodle-wolf", mode: "run", h: 58, dur: 5.5 },
  { id: "doodle-leapcat", mode: "leap", h: 82, dur: 4 },
  { id: "doodle-butterfly", mode: "fly", h: 46, dur: 11 },
  { id: "doodle-dragonfly", mode: "dart", h: 52, dur: 6 },
  { id: "doodle-sloth", mode: "hang", h: 120, dur: 9 },
  { id: "doodle-koala", mode: "peek", h: 96, dur: 6 },
  { id: "doodle-cat", mode: "peek", h: 100, dur: 6 },
];

type Walk = { id: number; kind: number; dir: 1 | -1; x: number; y: number };

function Walker({ w, onDone }: { w: Walk; onDone: () => void }) {
  const c = CRITTERS[w.kind];
  const [hearts, setHearts] = useState(false);
  useEffect(() => {
    const h = setTimeout(() => setHearts(true), c.dur * 450);
    const d = setTimeout(onDone, c.dur * 1000 + 300);
    return () => {
      clearTimeout(h);
      clearTimeout(d);
    };
  }, [onDone, c.dur]);

  const from = w.dir > 0 ? "-30vw" : "110vw";
  const to = w.dir > 0 ? "112vw" : "-35vw";
  const mid = "40vw";
  const flip = w.dir > 0 ? -1 : 1; // рисунки смотрят влево

  // траектории для разных характеров
  let pos: TargetAndTransition = {};
  let body: TargetAndTransition = {};
  let bodyT: Transition = { duration: 0.5, repeat: Infinity, ease: "easeInOut" };
  const lin = { duration: c.dur, ease: "linear" as const };
  switch (c.mode) {
    case "walk": // топает, останавливается посередине и подпрыгивает
      pos = { x: [from, mid, mid, to], y: [0, 0, -22, 0, 0], transition: { x: { ...lin, times: [0, 0.42, 0.6, 1] }, y: { duration: c.dur, times: [0, 0.45, 0.5, 0.55, 1] } } };
      body = { rotate: [-4, 4, -4], y: [0, -4, 0] };
      break;
    case "run": // несётся вприпрыжку
      pos = { x: [from, to], transition: { x: lin } };
      body = { y: [0, -16, 0], rotate: [6, -4, 6] };
      bodyT = { duration: 0.32, repeat: Infinity, ease: "easeOut" };
      break;
    case "leap": // котик прыгает дугами
      pos = { x: [from, "20vw", "55vw", to], y: [0, -150, 0, -110, 0, -80, 0], transition: { x: { ...lin, times: [0, 0.3, 0.65, 1] }, y: { duration: c.dur, ease: "easeInOut" } } };
      body = { rotate: [-10, 12, -10] };
      bodyT = { duration: c.dur / 3, repeat: Infinity };
      break;
    case "fly": // бабочка порхает волной
      pos = { x: [from, to], y: [0, -60, 20, -80, 10, -40, 0], transition: { x: lin, y: { duration: c.dur, ease: "easeInOut" } } };
      body = { scaleY: [1, 0.55, 1] };
      bodyT = { duration: 0.28, repeat: Infinity };
      break;
    case "dart": // стрекоза: рывками
      pos = { x: [from, "20vw", "35vw", "70vw", to], y: [0, -30, 30, -10, 0], transition: { x: { duration: c.dur, ease: "easeInOut" }, y: { duration: c.dur } } };
      body = { rotate: [-6, 6, -6] };
      bodyT = { duration: 0.15, repeat: Infinity };
      break;
    case "hang": // ленивец спускается сверху, качается и уползает обратно
      pos = { y: ["-110%", "0%", "0%", "-110%"], transition: { y: { duration: c.dur, times: [0, 0.2, 0.8, 1], ease: "easeInOut" } } };
      body = { rotate: [-8, 8, -8] };
      bodyT = { duration: 2.4, repeat: Infinity, ease: "easeInOut" };
      break;
    case "peek": // выглядывает снизу из угла
      pos = { y: ["100%", "18%", "18%", "100%"], transition: { y: { duration: c.dur, times: [0, 0.2, 0.8, 1], ease: "easeOut" } } };
      body = { rotate: [-6, 6, -6] };
      bodyT = { duration: 1.2, repeat: Infinity, ease: "easeInOut" };
      break;
  }

  const placement: React.CSSProperties =
    c.mode === "hang"
      ? { top: 0, left: `${w.x}%` }
      : c.mode === "peek"
        ? { bottom: 0, left: `${w.x}%` }
        : c.mode === "fly" || c.mode === "dart"
          ? { top: `${w.y}%`, left: 0 }
          : { bottom: 4, left: 0 };

  return (
    <motion.div className="absolute" style={{ ...placement, height: c.h }} animate={pos}>
      <motion.div className="h-full" style={{ scaleX: c.mode === "hang" || c.mode === "peek" ? 1 : flip, transformOrigin: c.mode === "hang" ? "50% 0%" : "50% 100%" }} animate={body} transition={bodyT}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(c.id)} alt="" draggable={false} className="h-full w-auto max-w-none" />
      </motion.div>
      <AnimatePresence>
        {hearts && c.mode !== "hang" && (
          <motion.svg
            viewBox="0 0 24 24"
            className="absolute -top-6 left-1/2 size-6 fill-[#ff7aa2]"
            initial={{ y: 10, opacity: 0, scale: 0.4 }}
            animate={{ y: -30, opacity: [0, 1, 1, 0], scale: 1.1 }}
            transition={{ duration: 1.6 }}
          >
            <path d="M12 21C6 17 2 13 2 8.5 2 5.4 4.4 3 7.3 3c1.9 0 3.6 1 4.7 2.6C13.1 4 14.8 3 16.7 3 19.6 3 22 5.4 22 8.5 22 13 18 17 12 21Z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- мем-гость: изредка выглядывает сбоку, кивает и прячется ----------
const PEEK_MEMES = ["meme-dog", "meme-rosecat", "meme-roblox", "meme-happymeal"];
type MemePeekT = { id: number; meme: string; side: 1 | -1; top: number };

function MemePeek({ p, onDone }: { p: MemePeekT; onDone: () => void }) {
  useEffect(() => {
    const d = setTimeout(onDone, 4200);
    return () => clearTimeout(d);
  }, [onDone]);
  const out = p.side > 0 ? "110%" : "-110%";
  const peek = p.side > 0 ? "30%" : "-30%";
  return (
    <motion.div
      className="absolute w-24"
      style={{ top: `${p.top}%`, [p.side > 0 ? "right" : "left"]: 0 }}
      initial={{ x: out, rotate: 0 }}
      animate={{ x: [out, peek, peek, out], rotate: [0, -14 * p.side, -6 * p.side, 0] }}
      transition={{ duration: 4, times: [0, 0.18, 0.82, 1], ease: "easeInOut" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetUrl(p.meme)} alt="" draggable={false} className="w-full drop-shadow-[0_6px_8px_rgba(90,30,50,.28)]" />
    </motion.div>
  );
}

// ---------- Y2K-звёздочки ----------
const HOLO = ["#ff9ce6", "#9cf3ff", "#fff59c", "#c7a6ff", "#ffffff", "#ffb3d1"];
const STAR4 = "M12 0 Q13.5 10.5 24 12 Q13.5 13.5 12 24 Q10.5 13.5 0 12 Q10.5 10.5 12 0Z";

type Burst = { id: number; x: number; y: number };

function TapSparkles() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const n = useRef(0);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const id = ++n.current;
      setBursts((b) => [...b.slice(-5), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return (
    <>
      {bursts.map((b) =>
        Array.from({ length: 7 }, (_, k) => {
          const a = (k / 7) * Math.PI * 2 + b.id;
          const dist = 34 + (k % 3) * 14;
          return (
            <motion.svg
              key={`${b.id}-${k}`}
              viewBox="0 0 24 24"
              className="absolute"
              style={{ left: b.x - 7, top: b.y - 7, width: 14, height: 14 }}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
              animate={{ x: Math.cos(a) * dist, y: Math.sin(a) * dist, scale: [0.3, 1.2, 0], opacity: [1, 1, 0], rotate: 90 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <path d={STAR4} fill={HOLO[k % HOLO.length]} stroke="#e88aa8" strokeWidth={0.8} />
            </motion.svg>
          );
        }),
      )}
    </>
  );
}

// хромированные блёстки в углах
function ChromeSparkles() {
  const spots: { pos: React.CSSProperties; s: number; d: number }[] = [
    { pos: { left: "7%", top: "11%" }, s: 22, d: 0 },
    { pos: { right: "9%", top: "7%" }, s: 16, d: 0.8 },
    { pos: { right: "5%", bottom: "18%" }, s: 20, d: 1.6 },
    { pos: { left: "4%", bottom: "28%" }, s: 14, d: 2.3 },
  ];
  return (
    <>
      <svg width={0} height={0} className="absolute">
        <defs>
          <linearGradient id="fun-chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#ffd1ec" />
            <stop offset="0.6" stopColor="#c9f1ff" />
            <stop offset="1" stopColor="#e6d4ff" />
          </linearGradient>
        </defs>
      </svg>
      {spots.map((p, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute drop-shadow-[0_0_6px_rgba(255,180,220,.9)]"
          style={{ ...p.pos, width: p.s, height: p.s }}
          animate={{ scale: [0.6, 1.15, 0.6], rotate: [0, 45, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.4, delay: p.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={STAR4} fill="url(#fun-chrome)" stroke="#f0a9c6" strokeWidth={0.6} />
        </motion.svg>
      ))}
    </>
  );
}

export function FunLayer({ walkers = true, memes = true }: { walkers?: boolean; memes?: boolean }) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [peeks, setPeeks] = useState<MemePeekT[]>([]);
  const n = useRef(0);

  useEffect(() => {
    if (!walkers) return;
    let t: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const id = ++n.current;
      setWalks((w) => [
        ...w,
        {
          id,
          kind: Math.floor(Math.random() * CRITTERS.length),
          dir: Math.random() > 0.5 ? 1 : -1,
          x: Math.random() > 0.5 ? 4 + Math.random() * 18 : 62 + Math.random() * 18,
          y: 18 + Math.random() * 50,
        },
      ]);
      t = setTimeout(spawn, 11000 + Math.random() * 10000);
    };
    t = setTimeout(spawn, 3500); // первый гость — вскоре после открытия акта
    return () => clearTimeout(t);
  }, [walkers]);

  // мем-гости — редко: первый через ~25 с, дальше раз в 40–65 с
  useEffect(() => {
    if (!walkers || !memes) return;
    let t: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const id = ++n.current;
      const meme = PEEK_MEMES[Math.floor(Math.random() * PEEK_MEMES.length)];
      setPeeks((p) => [...p, { id, meme, side: Math.random() > 0.5 ? 1 : -1, top: 25 + Math.random() * 40 }]);
      t = setTimeout(spawn, 40000 + Math.random() * 25000);
    };
    t = setTimeout(spawn, 22000 + Math.random() * 8000);
    return () => clearTimeout(t);
  }, [walkers, memes]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[25] overflow-hidden" aria-hidden>
      <ChromeSparkles />
      {walks.map((w) => (
        <Walker key={w.id} w={w} onDone={() => setWalks((all) => all.filter((x) => x.id !== w.id))} />
      ))}
      {peeks.map((p) => (
        <MemePeek key={p.id} p={p} onDone={() => setPeeks((all) => all.filter((x) => x.id !== p.id))} />
      ))}
      <TapSparkles />
    </div>
  );
}
