"use client";

// «Весёлый слой» поверх каждого акта:
//  • по низу экрана время от времени пробегает собачка или котик (нарисованы вручную),
//    посередине останавливается, подпрыгивает и выпускает сердечко;
//  • на каждое касание из-под пальца разлетаются переливающиеся Y2K-звёздочки;
//  • в углах тихо мерцают хромированные блёстки.
// Слой не мешает нажатиям (pointer-events: none).
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ---------- зверушки (вид сбоку, смотрят вправо) ----------
function Legs({ color, xs }: { color: string; xs: number[] }) {
  return (
    <>
      {xs.map((x, i) => (
        <rect
          key={x}
          x={x}
          y={62}
          width={9}
          height={15}
          rx={4.5}
          fill={color}
          style={{
            transformBox: "fill-box",
            transformOrigin: "50% 0%",
            animation: `fun-leg 0.32s ease-in-out ${i % 2 ? "0.16s" : "0s"} infinite alternate`,
          }}
        />
      ))}
    </>
  );
}

function Corgi() {
  return (
    <svg viewBox="0 0 130 90" className="size-full overflow-visible">
      {/* хвостик */}
      <g style={{ transformBox: "fill-box", transformOrigin: "100% 60%", animation: "fun-wag 0.25s ease-in-out infinite alternate" }}>
        <ellipse cx={22} cy={44} rx={9} ry={7} fill="#f3a65c" />
      </g>
      <Legs color="#f3a65c" xs={[36, 48, 76, 88]} />
      <ellipse cx={62} cy={52} rx={36} ry={19} fill="#f3a65c" />
      <ellipse cx={66} cy={60} rx={26} ry={10} fill="#fff8ee" />
      {/* голова */}
      <path d="M90 24 L94 6 L103 20 Z" fill="#f3a65c" stroke="#e48d3e" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M104 22 L114 7 L117 25 Z" fill="#f3a65c" stroke="#e48d3e" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={104} cy={38} r={18} fill="#f3a65c" />
      <ellipse cx={113} cy={45} rx={11} ry={8} fill="#fff8ee" />
      <ellipse cx={122} cy={41} rx={3.6} ry={3} fill="#3a2430" />
      <circle cx={106} cy={33} r={2.8} fill="#3a2430" />
      <circle cx={107} cy={32} r={0.9} fill="#fff" />
      <ellipse cx={99} cy={44} rx={4.5} ry={2.6} fill="#ff8fb0" opacity={0.6} />
      <path d="M114 50 q3 7 7 1" fill="#ff7b9c" />
    </svg>
  );
}

function Puppy() {
  // белый пушистый щенок-облачко
  return (
    <svg viewBox="0 0 130 90" className="size-full overflow-visible">
      <g style={{ transformBox: "fill-box", transformOrigin: "100% 70%", animation: "fun-wag 0.22s ease-in-out infinite alternate" }}>
        <circle cx={24} cy={38} r={9} fill="#fffaf6" stroke="#ead8e0" strokeWidth={1.5} />
      </g>
      <Legs color="#fffaf6" xs={[38, 50, 74, 86]} />
      {[34, 48, 62, 76, 90].map((x, i) => (
        <circle key={x} cx={x} cy={50 + (i % 2) * 3} r={16} fill="#fffaf6" stroke="#ead8e0" strokeWidth={1.5} />
      ))}
      <ellipse cx={62} cy={52} rx={30} ry={14} fill="#fffaf6" />
      <circle cx={104} cy={36} r={19} fill="#fffaf6" stroke="#ead8e0" strokeWidth={1.5} />
      <ellipse cx={94} cy={34} rx={7} ry={13} fill="#f3e2e8" transform="rotate(14 94 34)" />
      <circle cx={109} cy={33} r={2.8} fill="#3a2430" />
      <circle cx={110} cy={32} r={0.9} fill="#fff" />
      <ellipse cx={120} cy={40} rx={3.4} ry={2.8} fill="#3a2430" />
      <ellipse cx={104} cy={43} rx={4.5} ry={2.6} fill="#ff8fb0" opacity={0.6} />
      {/* розовый бантик */}
      <path d="M100 18 l-8 -5 l0 10 Z M100 18 l8 -5 l0 10 Z" fill="#f7a8c0" stroke="#e27a9b" strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={100} cy={18} r={2.6} fill="#e88aa8" />
    </svg>
  );
}

function Kitty() {
  return (
    <svg viewBox="0 0 130 90" className="size-full overflow-visible">
      {/* хвост трубой */}
      <g style={{ transformBox: "fill-box", transformOrigin: "100% 100%", animation: "fun-wag 0.6s ease-in-out infinite alternate" }}>
        <path d="M30 50 C14 46 10 26 20 14" fill="none" stroke="#b9a4c9" strokeWidth={8} strokeLinecap="round" />
      </g>
      <Legs color="#b9a4c9" xs={[38, 50, 74, 86]} />
      <ellipse cx={62} cy={52} rx={34} ry={17} fill="#b9a4c9" />
      <path d="M52 38 q4 6 0 12 M62 37 q4 6 0 12 M72 38 q4 6 0 12" fill="none" stroke="#9f88b3" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M90 26 L92 8 L104 20 Z" fill="#b9a4c9" />
      <path d="M108 20 L118 8 L120 28 Z" fill="#b9a4c9" />
      <path d="M93 13 L95 21 L100 19 Z M114 13 L113 22 L117 22 Z" fill="#f7a8c0" />
      <circle cx={106} cy={38} r={17} fill="#b9a4c9" />
      <circle cx={110} cy={34} r={2.8} fill="#3a2430" />
      <circle cx={111} cy={33} r={0.9} fill="#fff" />
      <path d="M118 40 l3 2 l-3 2" fill="#ff8fb0" />
      <path d="M116 46 q2.5 3 5 0" fill="none" stroke="#3a2430" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M120 44 l9 -2 M120 46 l9 1" stroke="#fff" strokeWidth={1} opacity={0.8} />
      <ellipse cx={101} cy={44} rx={4.5} ry={2.6} fill="#ff8fb0" opacity={0.6} />
    </svg>
  );
}

const ANIMALS = [Corgi, Puppy, Kitty];

type Walk = { id: number; kind: number; dir: 1 | -1; size: number };

function Walker({ w, onDone }: { w: Walk; onDone: () => void }) {
  const Animal = ANIMALS[w.kind];
  const [hearts, setHearts] = useState(false);
  useEffect(() => {
    const h = setTimeout(() => setHearts(true), 3900);
    const d = setTimeout(onDone, 9500);
    return () => {
      clearTimeout(h);
      clearTimeout(d);
    };
  }, [onDone]);

  const from = w.dir > 0 ? "-30vw" : "110vw";
  const mid = w.dir > 0 ? "38vw" : "48vw";
  const to = w.dir > 0 ? "115vw" : "-35vw";
  return (
    <motion.div
      className="absolute bottom-1"
      style={{ width: w.size, height: w.size * 0.7, left: 0 }}
      initial={{ x: from }}
      animate={{ x: [from, mid, mid, to], y: [0, 0, -26, 0, -14, 0, 0] }}
      transition={{
        x: { duration: 9, times: [0, 0.4, 0.62, 1], ease: "linear" },
        y: { duration: 9, times: [0, 0.42, 0.46, 0.5, 0.54, 0.58, 1], ease: "easeOut" },
      }}
    >
      <motion.div
        className="size-full"
        style={{ scaleX: w.dir }}
        animate={{ rotate: [0, -3, 0, 3, 0] }}
        transition={{ duration: 0.32, repeat: Infinity }}
      >
        <Animal />
      </motion.div>
      <AnimatePresence>
        {hearts && (
          <motion.svg
            viewBox="0 0 24 24"
            className="absolute -top-6 left-1/2 size-7 fill-[#ff7aa2]"
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

export function FunLayer({ walkers = true }: { walkers?: boolean }) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const n = useRef(0);

  useEffect(() => {
    if (!walkers) return;
    let t: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const id = ++n.current;
      setWalks((w) => [
        ...w,
        { id, kind: Math.floor(Math.random() * ANIMALS.length), dir: Math.random() > 0.5 ? 1 : -1, size: 92 + Math.random() * 30 },
      ]);
      t = setTimeout(spawn, 15000 + Math.random() * 12000);
    };
    t = setTimeout(spawn, 3500); // первый гость — вскоре после открытия акта
    return () => clearTimeout(t);
  }, [walkers]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[25] overflow-hidden" aria-hidden>
      <ChromeSparkles />
      {walks.map((w) => (
        <Walker key={w.id} w={w} onDone={() => setWalks((all) => all.filter((x) => x.id !== w.id))} />
      ))}
      <TapSparkles />
    </div>
  );
}
