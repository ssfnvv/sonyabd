"use client";

// Стеклянная баночка с пробкой и ленточкой, внутри — свёрнутые записки.
// Количество записок внутри уменьшается по мере того, как их достают.
import { motion } from "framer-motion";
import { hash } from "./RansomText";

const NOTE_COLORS = ["#fde4ec", "#fff3a8", "#d8efdf", "#cfe0f5", "#fff8f0", "#f9c5d5", "#e8d5f5"];

export function Jar({ count, shaking }: { count: number; shaking: boolean }) {
  // раскладываем записки «насыпью» внизу банки
  const shown = Math.min(count, 18);
  const notes = Array.from({ length: shown }, (_, i) => {
    const r = (k: number) => hash(`note${i}${k}`);
    const row = Math.floor(i / 5);
    const col = i % 5;
    return {
      x: 72 + col * 34 + (r(1) - 0.5) * 16 + (row % 2) * 14,
      y: 268 - row * 24 + (r(2) - 0.5) * 10,
      rot: (r(3) - 0.5) * 80,
      color: NOTE_COLORS[Math.floor(r(4) * NOTE_COLORS.length)],
    };
  });

  return (
    <motion.svg
      viewBox="0 0 300 330"
      className="w-full drop-shadow-[0_18px_22px_rgba(122,59,82,.25)]"
      animate={shaking ? { rotate: [0, -8, 7, -6, 5, -2, 0], y: [0, -10, 0, -6, 0] } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{ transformOrigin: "50% 90%" }}
    >
      <defs>
        <linearGradient id="jar-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="0.8" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id="jar-inside">
          <path d="M62 92 Q50 110 50 140 V280 Q50 306 80 306 H220 Q250 306 250 280 V140 Q250 110 238 92 Z" />
        </clipPath>
      </defs>

      {/* записки внутри */}
      <g clipPath="url(#jar-inside)">
        {notes.map((n, i) => (
          <g key={i} transform={`translate(${n.x} ${n.y}) rotate(${n.rot})`}>
            <rect x={-22} y={-10} width={44} height={20} rx={3} fill={n.color} stroke="#d9a3b5" strokeWidth={1} />
            <line x1={-22} x2={22} y1={0} y2={0} stroke="#d9a3b5" strokeWidth={0.8} opacity={0.6} />
          </g>
        ))}
      </g>

      {/* стекло */}
      <path
        d="M62 92 Q50 110 50 140 V280 Q50 306 80 306 H220 Q250 306 250 280 V140 Q250 110 238 92 Z"
        fill="url(#jar-glass)"
        stroke="#e8b4c4"
        strokeWidth={3}
      />
      <path d="M68 130 V270" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.55} />
      <path d="M84 120 V150" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.45} />

      {/* горлышко и пробка */}
      <rect x={70} y={74} width={160} height={22} rx={8} fill="#fff" fillOpacity={0.4} stroke="#e8b4c4" strokeWidth={3} />
      <path d="M82 34 Q80 22 92 20 H208 Q220 22 218 34 L224 76 H76Z" fill="#d9b48a" stroke="#b88b5e" strokeWidth={3} />
      {[100, 128, 156, 184].map((x) => (
        <circle key={x} cx={x + (x % 3)} cy={44 + (x % 5) * 4} r={2.2} fill="#b88b5e" opacity={0.6} />
      ))}

      {/* ленточка с бантом */}
      <rect x={66} y={84} width={168} height={10} fill="#f7a8c0" />
      <path d="M150 89 C130 70 106 76 112 92 C116 104 140 98 150 89Z" fill="#f7a8c0" stroke="#e27a9b" strokeWidth={2} />
      <path d="M150 89 C170 70 194 76 188 92 C184 104 160 98 150 89Z" fill="#f7a8c0" stroke="#e27a9b" strokeWidth={2} />
      <path d="M146 92 L136 122 L148 116 L152 126 L156 94Z" fill="#f7a8c0" stroke="#e27a9b" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={150} cy={90} r={6} fill="#e88aa8" />
    </motion.svg>
  );
}
