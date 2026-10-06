"use client";

// Дудлы «от руки» по краям экрана: сердечки, звёздочки, завитки, ноты, вопросики…
// Положение и вид зависят от seed, поэтому на каждом акте свой узор, но всегда одинаковый.
// Лежат под содержимым и не мешают нажатиям.
import { motion } from "framer-motion";
import { hash } from "./RansomText";

// Каждый дудл — набор штрихов в квадрате 60×60
const DOODLES: Record<string, string[]> = {
  heart: ["M30 50 C12 38 6 28 10 19 C14 10 25 10 30 20 C35 10 46 10 50 19 C54 28 48 38 30 50"],
  star: ["M30 6 L36 23 L54 24 L40 35 L45 53 L30 43 L15 53 L20 35 L6 24 L24 23 Z"],
  sparkle: ["M30 6 Q32 28 54 30 Q32 32 30 54 Q28 32 6 30 Q28 28 30 6", "M50 8 l0 8 M46 12 l8 0"],
  swirl: ["M30 30 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a12 12 0 1 1 -12 -12 a18 18 0 1 1 18 18"],
  squiggle: ["M4 34 q6 -14 12 0 t12 0 t12 0 t12 0 t6 -4"],
  arrow: ["M8 46 C18 20 34 14 50 16", "M42 9 L51 16 L43 24"],
  flower: [
    "M30 30 m-5 -9 a6 6 0 1 1 10 0 a6 6 0 1 1 5 9 a6 6 0 1 1 -5 9 a6 6 0 1 1 -10 0 a6 6 0 1 1 -5 -9 a6 6 0 1 1 5 -9",
    "M30 30 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0",
  ],
  smile: ["M30 6 a24 24 0 1 0 0.1 0", "M21 24 l0 4 M39 24 l0 4", "M19 36 Q30 46 41 36"],
  note: ["M22 44 a6 5 0 1 1 -1 -1 L21 12 L44 7 L44 38", "M44 38 a6 5 0 1 1 -1 -1", "M21 19 L44 14"],
  question: ["M20 20 Q20 8 31 8 Q43 8 42 19 Q41 27 31 30 L31 38", "M31 47 l0 1"],
  crown: ["M8 44 L12 18 L22 32 L30 12 L38 32 L48 18 L52 44 Z", "M10 50 L50 50"],
  cloud: ["M14 42 Q4 42 6 33 Q8 25 17 27 Q19 15 31 16 Q42 17 43 27 Q55 25 55 35 Q55 43 45 42 Z"],
  bolt: ["M34 4 L16 32 L29 32 L24 56 L44 24 L31 24 Z"],
  dots: ["M10 30 l0 0.5", "M30 30 l0 0.5", "M50 30 l0 0.5", "M20 14 l0 0.5", "M40 46 l0 0.5"],
  ring: ["M12 22 q4 -8 8 0", "M8 30 q8 -16 16 0", "M40 22 q4 -8 8 0", "M36 30 q8 -16 16 0"],
};

const COLORS = ["#e88aa8", "#d9628a", "#f6b94a", "#8fb8e8", "#9fd3a9", "#c99be0"];

type Kind = keyof typeof DOODLES;

export function Doodles({
  seed,
  count = 10,
  kinds,
  light,
}: {
  seed: string;
  count?: number;
  kinds?: Kind[];
  light?: boolean; // для тёмного фона — светлые линии
}) {
  const pool = (kinds ?? (Object.keys(DOODLES) as Kind[])).filter((k) => k in DOODLES);
  const items = Array.from({ length: count }, (_, i) => {
    const r = (k: number) => hash(`${seed}|${i}|${k}`);
    const left = i % 2 === 0; // чередуем края
    return {
      kind: pool[Math.floor(r(1) * pool.length)],
      x: left ? 1 + r(2) * 13 : 86 + r(2) * 12, // проценты ширины — только по краям
      y: 4 + ((i + r(3)) / count) * 90, // равномерно по высоте
      size: 30 + r(4) * 26,
      rot: (r(5) - 0.5) * 50,
      color: light ? "#fde4ec" : COLORS[Math.floor(r(6) * COLORS.length)],
      delay: r(7) * 1.5,
      dur: 3 + r(8) * 3,
    };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {items.map((d, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 60 60"
          className="absolute"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, opacity: light ? 0.45 : 0.8 }}
          initial={{ opacity: 0, scale: 0.4, rotate: d.rot - 20 }}
          animate={{ opacity: light ? 0.45 : 0.8, scale: 1, rotate: [d.rot - 6, d.rot + 6, d.rot - 6], y: [0, -5, 0] }}
          transition={{
            opacity: { delay: d.delay, duration: 0.6 },
            scale: { delay: d.delay, type: "spring", damping: 10 },
            rotate: { delay: d.delay, duration: d.dur, repeat: Infinity, ease: "easeInOut" },
            y: { delay: d.delay, duration: d.dur * 0.8, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {DOODLES[d.kind].map((p, k) => (
            <motion.path
              key={k}
              d={p}
              fill="none"
              stroke={d.color}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: d.delay + 0.1 + k * 0.15, duration: 0.9, ease: "easeInOut" }}
            />
          ))}
        </motion.svg>
      ))}
    </div>
  );
}
