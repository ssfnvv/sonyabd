"use client";

// Розовый дисковый телефон. Трубка подпрыгивает, когда звонит, поднимается при разговоре.
// Витой провод пересчитывается на лету, поэтому всегда соединяет трубку и корпус.
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

// Витой провод между двумя точками: синусоида с кольцами
function coil(x0: number, y0: number, x1: number, y1: number): string {
  const n = 46;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  // провод провисает вниз
  const sag = 34;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const bx = x0 + dx * t;
    const by = y0 + dy * t + Math.sin(Math.PI * t) * sag;
    const w = Math.sin(t * Math.PI * 14) * 5.5;
    const x = bx + nx * w;
    const y = by + ny * w;
    d += i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function RotaryPhone({
  state,
  onHandset,
}: {
  state: "idle" | "ringing" | "talking";
  onHandset?: () => void;
}) {
  const lift = useSpring(0, { stiffness: 140, damping: 16 });
  useEffect(() => {
    lift.set(state === "talking" ? 1 : 0);
  }, [state, lift]);

  // положение трубки: в покое — на рычагах, при разговоре — поднята и наклонена
  const hy = useTransform(lift, (v) => -v * 78);
  const hr = useTransform(lift, (v) => -v * 14);
  const cord = useTransform(lift, (v) => coil(46, 186, 58 - v * 6, 118 - v * 80));

  return (
    <motion.svg
      viewBox="0 0 300 270"
      className="w-full overflow-visible drop-shadow-[0_18px_22px_rgba(122,59,82,.3)]"
      animate={state === "ringing" ? { rotate: [0, -2.5, 2.5, -2.5, 2.5, 0] } : { rotate: 0 }}
      transition={state === "ringing" ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.9 } : { duration: 0.2 }}
    >
      <defs>
        <linearGradient id="ph-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbc6d6" />
          <stop offset="1" stopColor="#ef9db6" />
        </linearGradient>
        <linearGradient id="ph-hand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd0dd" />
          <stop offset="1" stopColor="#f19fb8" />
        </linearGradient>
      </defs>

      {/* провод */}
      <motion.path d={cord} fill="none" stroke="#e27a9b" strokeWidth={3} strokeLinecap="round" />

      {/* корпус */}
      <path d="M36 248 Q22 168 78 140 H222 Q278 168 264 248 Q150 262 36 248Z" fill="url(#ph-body)" stroke="#d9628a" strokeWidth={3} />
      <path d="M58 236 Q50 178 90 156 H210 Q250 178 242 236" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} />
      {/* рычаги */}
      <rect x={70} y={126} width={22} height={22} rx={6} fill="#ef9db6" stroke="#d9628a" strokeWidth={2.5} />
      <rect x={208} y={126} width={22} height={22} rx={6} fill="#ef9db6" stroke="#d9628a" strokeWidth={2.5} />

      {/* диск */}
      <circle cx={150} cy={202} r={48} fill="#fff8f0" stroke="#d9628a" strokeWidth={3} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = ((-60 + i * 28) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={150 + Math.cos(a) * 33}
            cy={202 + Math.sin(a) * 33}
            r={7.5}
            fill="#fde4ec"
            stroke="#e27a9b"
            strokeWidth={2}
          />
        );
      })}
      <circle cx={150} cy={202} r={17} fill="#e88aa8" />
      <path d="M150 210c-6-4-9-7-9-10.5 0-2.4 1.9-4.3 4.3-4.3 1.9 0 3.4 1 4.7 2.6 1.3-1.6 2.8-2.6 4.7-2.6 2.4 0 4.3 1.9 4.3 4.3 0 3.5-3 6.5-9 10.5Z" fill="#fff8f0" />
      <path d="M190 236 l12 -8" stroke="#c9688a" strokeWidth={4} strokeLinecap="round" />

      {/* трубка */}
      <motion.g
        style={{ y: hy, rotate: hr, transformOrigin: "150px 120px", cursor: onHandset ? "pointer" : undefined }}
        onClick={onHandset}
      >
       <motion.g
        animate={state === "ringing" ? { y: [0, -9, 0, -6, 0] } : { y: 0 }}
        transition={state === "ringing" ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.9 } : { duration: 0.2 }}
       >
        {/* большая прозрачная зона, чтобы по трубке было легко попасть пальцем */}
        <rect x={20} y={70} width={260} height={80} fill="transparent" />
        <path d="M66 104 Q150 74 234 104" fill="none" stroke="#d9628a" strokeWidth={30} strokeLinecap="round" />
        <path d="M66 104 Q150 74 234 104" fill="none" stroke="url(#ph-hand)" strokeWidth={24} strokeLinecap="round" />
        <path d="M80 96 Q150 76 220 96" fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={58} cy={120} rx={30} ry={17} fill="url(#ph-hand)" stroke="#d9628a" strokeWidth={3} />
        <ellipse cx={242} cy={120} rx={30} ry={17} fill="url(#ph-hand)" stroke="#d9628a" strokeWidth={3} />
        {[-8, 0, 8].map((dx) => (
          <circle key={dx} cx={58 + dx} cy={124} r={2} fill="#c9688a" />
        ))}
        {[-8, 0, 8].map((dx) => (
          <circle key={dx} cx={242 + dx} cy={124} r={2} fill="#c9688a" />
        ))}
       </motion.g>
      </motion.g>
    </motion.svg>
  );
}
