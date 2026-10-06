"use client";

// Пухлый розовый дисковый телефон с личиком.
// Звонит — глазки удивлённо открыты, трубка подпрыгивает, рядом «дзынь-дуги».
// Разговор — трубка поднимается, глазки жмурятся. В покое — спокойные дуги-глазки.
// Витой провод пересчитывается на лету и всегда соединяет трубку и корпус.
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function coil(x0: number, y0: number, x1: number, y1: number): string {
  const n = 54;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const bx = x0 + dx * t - Math.sin(Math.PI * t) * 26; // провод уходит дугой влево
    const by = y0 + dy * t + Math.sin(Math.PI * t) * 12;
    const w = Math.sin(t * Math.PI * 16) * 6;
    d += `${i ? " L" : "M"}${(bx + nx * w).toFixed(1)} ${(by + ny * w).toFixed(1)}`;
  }
  return d;
}

const INK = "#c45b80";

export function RotaryPhone({ state, onHandset }: { state: "idle" | "ringing" | "talking"; onHandset?: () => void }) {
  const lift = useSpring(0, { stiffness: 130, damping: 15 });
  useEffect(() => {
    lift.set(state === "talking" ? 1 : 0);
  }, [state, lift]);

  const hy = useTransform(lift, (v) => -v * 84);
  const hr = useTransform(lift, (v) => -v * 16);
  const cord = useTransform(lift, (v) => coil(44, 222, 52 + v * 2, 128 - v * 84));

  const eyes =
    state === "ringing" ? (
      // удивлённые круглые глазки
      <>
        <circle cx={86} cy={200} r={6.5} fill={INK} />
        <circle cx={214} cy={200} r={6.5} fill={INK} />
        <circle cx={88} cy={198} r={2} fill="#fff" />
        <circle cx={216} cy={198} r={2} fill="#fff" />
        <ellipse cx={150} cy={262} rx={0} ry={0} />
      </>
    ) : state === "talking" ? (
      // счастливые зажмуренные ^ ^
      <>
        <path d="M79 203 L86 195 L93 203" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M207 203 L214 195 L221 203" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      // спокойные дуги
      <>
        <path d="M79 198 Q86 205 93 198" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M207 198 Q214 205 221 198" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      </>
    );

  return (
    <motion.svg
      viewBox="0 0 300 285"
      className="w-full overflow-visible"
      animate={state === "ringing" ? { rotate: [0, -3, 3, -3, 3, 0] } : { rotate: 0 }}
      transition={state === "ringing" ? { duration: 0.45, repeat: Infinity, repeatDelay: 0.95 } : { duration: 0.2 }}
      style={{ transformOrigin: "50% 90%" }}
    >
      <defs>
        <linearGradient id="ph2-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd6e2" />
          <stop offset="0.6" stopColor="#f9b3c8" />
          <stop offset="1" stopColor="#f09ab4" />
        </linearGradient>
        <linearGradient id="ph2-hand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffdbe5" />
          <stop offset="1" stopColor="#f4a4bd" />
        </linearGradient>
        <radialGradient id="ph2-dial" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fffdf9" />
          <stop offset="1" stopColor="#fbeee3" />
        </radialGradient>
      </defs>

      {/* мягкая тень */}
      <ellipse cx={150} cy={272} rx={112} ry={9} fill="#7a3b52" opacity={0.13} />

      {/* провод */}
      <motion.path d={cord} fill="none" stroke="#e8869f" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />

      {/* ножки */}
      <rect x={70} y={252} width={34} height={16} rx={8} fill="#e98aa6" />
      <rect x={196} y={252} width={34} height={16} rx={8} fill="#e98aa6" />

      {/* пухлый корпус */}
      <path
        d="M36 236 C30 186 58 150 104 142 H196 C242 150 270 186 264 236 Q263 258 240 258 H60 Q37 258 36 236 Z"
        fill="url(#ph2-body)"
        stroke="#de6f95"
        strokeWidth={3}
      />
      <path d="M62 178 C76 160 96 154 118 153" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.55} />
      <circle cx={130} cy={154} r={3.5} fill="#fff" opacity={0.6} />

      {/* рычаги-подушечки */}
      <rect x={78} y={128} width={30} height={24} rx={12} fill="#f4a8be" stroke="#de6f95" strokeWidth={2.5} />
      <rect x={192} y={128} width={30} height={24} rx={12} fill="#f4a8be" stroke="#de6f95" strokeWidth={2.5} />

      {/* личико: глазки и румянец */}
      {eyes}
      <ellipse cx={80} cy={220} rx={13} ry={7.5} fill="#ff8fb0" opacity={0.42} />
      <ellipse cx={220} cy={220} rx={13} ry={7.5} fill="#ff8fb0" opacity={0.42} />

      {/* диск */}
      <circle cx={150} cy={208} r={50} fill="#fff" opacity={0.5} />
      <circle cx={150} cy={208} r={46} fill="url(#ph2-dial)" stroke="#de6f95" strokeWidth={3} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = ((-62 + i * 28.5) * Math.PI) / 180;
        const x = 150 + Math.cos(a) * 31;
        const y = 208 + Math.sin(a) * 31;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={8} fill="#ffe3ec" stroke="#eb8fab" strokeWidth={2} />
            <circle cx={x - 1.5} cy={y - 1.5} r={2} fill="#fff" opacity={0.8} />
          </g>
        );
      })}
      {/* упор диска */}
      <path d="M186 240 Q194 236 199 229" fill="none" stroke="#e7b75f" strokeWidth={5} strokeLinecap="round" />
      {/* центр с сердечком */}
      <circle cx={150} cy={208} r={17} fill="#ec8aa9" stroke="#de6f95" strokeWidth={2} />
      <path d="M150 217c-6.5-4.3-9.5-7.6-9.5-11.2 0-2.6 2-4.6 4.6-4.6 2 0 3.7 1.1 4.9 2.8 1.2-1.7 2.9-2.8 4.9-2.8 2.6 0 4.6 2 4.6 4.6 0 3.6-3 6.9-9.5 11.2Z" fill="#fff8f0" />

      {/* «дзынь-дуги» при звонке */}
      {state === "ringing" &&
        [-1, 1].map((side) => (
          <motion.g key={side} animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.5 }} style={{ transformOrigin: `${150 + side * 140}px 100px` }}>
            <path d={side < 0 ? "M16 88 Q6 104 16 120" : "M284 88 Q294 104 284 120"} fill="none" stroke="#de6f95" strokeWidth={3.5} strokeLinecap="round" />
            <path d={side < 0 ? "M4 80 Q-10 104 4 128" : "M296 80 Q310 104 296 128"} fill="none" stroke="#de6f95" strokeWidth={3.5} strokeLinecap="round" opacity={0.6} />
          </motion.g>
        ))}

      {/* трубка */}
      <motion.g style={{ y: hy, rotate: hr, transformOrigin: "150px 118px", cursor: onHandset ? "pointer" : undefined }} onClick={onHandset}>
        <motion.g
          animate={state === "ringing" ? { y: [0, -10, 0, -6, 0] } : { y: 0 }}
          transition={state === "ringing" ? { duration: 0.45, repeat: Infinity, repeatDelay: 0.95 } : { duration: 0.2 }}
        >
          <rect x={14} y={62} width={272} height={90} fill="transparent" />
          {/* ручка */}
          <path d="M60 112 Q150 66 240 112" fill="none" stroke="#de6f95" strokeWidth={36} strokeLinecap="round" />
          <path d="M60 112 Q150 66 240 112" fill="none" stroke="url(#ph2-hand)" strokeWidth={30} strokeLinecap="round" />
          <path d="M78 100 Q150 70 222 100" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
          {/* чашки */}
          <rect x={20} y={110} width={74} height={34} rx={17} fill="url(#ph2-hand)" stroke="#de6f95" strokeWidth={3} />
          <rect x={206} y={110} width={74} height={34} rx={17} fill="url(#ph2-hand)" stroke="#de6f95" strokeWidth={3} />
          {[-12, 0, 12].map((dx) => (
            <g key={dx}>
              <circle cx={57 + dx} cy={128} r={2.4} fill="#d76a8f" />
              <circle cx={243 + dx} cy={128} r={2.4} fill="#d76a8f" />
            </g>
          ))}
          {/* бантик на трубке */}
          <g transform="translate(150 86)">
            <path d="M0 0 C-10 -12 -26 -8 -22 3 C-19 12 -6 8 0 0Z" fill="#fff6f0" stroke="#de6f95" strokeWidth={2.2} />
            <path d="M0 0 C10 -12 26 -8 22 3 C19 12 6 8 0 0Z" fill="#fff6f0" stroke="#de6f95" strokeWidth={2.2} />
            <path d="M-3 2 L-9 18 L-2 14 L1 20 L4 3Z" fill="#fff6f0" stroke="#de6f95" strokeWidth={2} strokeLinejoin="round" />
            <circle cx={0} cy={1} r={4.5} fill="#ec8aa9" />
          </g>
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
