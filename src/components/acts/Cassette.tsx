"use client";

// Кассета в пастельной гамме. Катушки крутятся, пока играет эфир,
// плёнка «перетекает» с левой катушки на правую по мере прослушивания.
// На наклейке от руки написано имя того, кто сейчас говорит.
import { AnimatePresence, motion } from "framer-motion";

export function Cassette({ progress, playing, label }: { progress: number; playing: boolean; label?: string }) {
  const p = Math.max(0, Math.min(1, progress));
  const rMin = 15;
  const rMax = 40;
  const rL = rMin + (rMax - rMin) * Math.sqrt(1 - p); // корень — площадь плёнки убывает равномерно
  const rR = rMin + (rMax - rMin) * Math.sqrt(p);
  const L = { x: 122, y: 112 };
  const R = { x: 238, y: 112 };

  const hub = (cx: number, cy: number, dir: 1 | -1) => (
    <g
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        animation: `cassette-spin ${dir > 0 ? 1.8 : 1.4}s linear infinite`,
        animationPlayState: playing ? "running" : "paused",
      }}
    >
      <circle cx={cx} cy={cy} r={12} fill="#fffaf5" stroke="#c9688a" strokeWidth={2} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <rect
          key={a}
          x={cx - 1.6}
          y={cy - 12}
          width={3.2}
          height={6}
          rx={1}
          fill="#c9688a"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={4.5} fill="#3a2430" />
    </g>
  );

  return (
    <svg viewBox="0 0 360 236" className="w-full drop-shadow-[0_18px_24px_rgba(122,59,82,.28)]" role="img" aria-label={label}>
      <defs>
        <clipPath id="cass-window">
          <rect x={78} y={84} width={204} height={56} rx={28} />
        </clipPath>
        <linearGradient id="cass-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbc8d7" />
          <stop offset="1" stopColor="#f3a9c0" />
        </linearGradient>
        <linearGradient id="cass-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2f3c" />
          <stop offset="1" stopColor="#2d1b24" />
        </linearGradient>
      </defs>

      {/* корпус */}
      <rect x={4} y={4} width={352} height={228} rx={18} fill="url(#cass-body)" stroke="#d9628a" strokeWidth={3} />
      <rect x={12} y={12} width={336} height={212} rx={13} fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={1.5} />
      {[
        [18, 18],
        [342, 18],
        [18, 218],
        [342, 218],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={5} fill="#fde4ec" stroke="#c9688a" strokeWidth={1.5} />
          <path d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke="#c9688a" strokeWidth={1.3} />
        </g>
      ))}

      {/* наклейка */}
      <rect x={30} y={24} width={300} height={130} rx={9} fill="#fff8f0" />
      <rect x={30} y={24} width={300} height={14} rx={7} fill="#f7a8c0" />
      <rect x={30} y={31} width={300} height={7} fill="#f7a8c0" />
      <rect x={30} y={142} width={300} height={5} fill="#fde4ec" />
      {[58, 72].map((y) => (
        <line key={y} x1={44} x2={316} y1={y} y2={y} stroke="#f3c6d3" strokeWidth={1} />
      ))}

      {/* имя на наклейке, «от руки» */}
      <AnimatePresence mode="wait">
        {label && (
          <motion.text
            key={label}
            x={180}
            y={67}
            textAnchor="middle"
            fontFamily="Caveat, cursive"
            fontWeight={700}
            fontSize={30}
            fill="#7a3b52"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {label}
          </motion.text>
        )}
      </AnimatePresence>

      {/* окошко с плёнкой */}
      <rect x={78} y={84} width={204} height={56} rx={28} fill="url(#cass-glass)" />
      <g clipPath="url(#cass-window)">
        <circle cx={L.x} cy={L.y} r={rL} fill="#6b4434" />
        <circle cx={R.x} cy={R.y} r={rR} fill="#6b4434" />
        <circle cx={L.x} cy={L.y} r={rL} fill="none" stroke="#8a5a44" strokeWidth={1} opacity={0.6} />
        <circle cx={R.x} cy={R.y} r={rR} fill="none" stroke="#8a5a44" strokeWidth={1} opacity={0.6} />
        {/* окошко-счётчик между катушками */}
        <rect x={160} y={98} width={40} height={28} rx={4} fill="#ffffff" opacity={0.08} />
      </g>
      {hub(L.x, L.y, 1)}
      {hub(R.x, R.y, -1)}
      <rect x={78} y={84} width={204} height={56} rx={28} fill="none" stroke="#c9688a" strokeWidth={2} />
      <path d="M92 90 Q180 80 268 90" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={6} fill="none" strokeLinecap="round" />

      {/* нижняя часть с отверстиями */}
      <path d="M72 232 L92 178 H268 L288 232" fill="#ee9db6" stroke="#d9628a" strokeWidth={3} strokeLinejoin="round" />
      {[118, 150, 210, 242].map((x) => (
        <circle key={x} cx={x} cy={204} r={x === 150 || x === 210 ? 7 : 5} fill="#c9688a" />
      ))}
      <rect x={168} y={196} width={24} height={14} rx={3} fill="#c9688a" />
    </svg>
  );
}
