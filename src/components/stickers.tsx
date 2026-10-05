// Свой набор стикеров в пастельно-розовой и кремовой гамме. Всё нарисовано вручную в SVG.
import type { ReactNode } from "react";

const P = { pink: "#f7a8c0", pinkDeep: "#e27a9b", soft: "#fde4ec", cream: "#fff3e3", gold: "#f6cf7a", leaf: "#a8d5ae", ink: "#7a3b52" };

type Sticker = { id: string; svg: ReactNode };

export const STICKERS: Sticker[] = [
  {
    id: "heart",
    svg: (
      <>
        <path d="M50 88C22 68 8 51 8 33 8 19 18 9 31 9c9 0 15 5 19 12 4-7 10-12 19-12 13 0 23 10 23 24 0 18-14 35-42 55Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="30" cy="30" rx="8" ry="5" fill="#fff" opacity=".7" transform="rotate(-35 30 30)" />
      </>
    ),
  },
  {
    id: "flower",
    svg: (
      <>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="50" cy="27" rx="15" ry="20" fill={P.soft} stroke={P.pinkDeep} strokeWidth="3.5" transform={`rotate(${a} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="13" fill={P.gold} stroke="#e0a94a" strokeWidth="3.5" />
      </>
    ),
  },
  {
    id: "bow",
    svg: (
      <>
        <path d="M44 54 34 88l10-5 6 9 2-38Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M56 54l10 34-10-5-6 9-2-38Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M50 48C38 30 10 22 10 42s28 18 40 6Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M50 48C62 30 90 22 90 42s-28 18-40 6Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="41" y="38" width="18" height="20" rx="7" fill={P.pinkDeep} />
      </>
    ),
  },
  {
    id: "star",
    svg: (
      <path d="M50 8l11 25 27 3-20 18 6 27-24-14-24 14 6-27-20-18 27-3Z" fill={P.gold} stroke="#e0a94a" strokeWidth="4" strokeLinejoin="round" />
    ),
  },
  {
    id: "sparkle",
    svg: (
      <>
        <path d="M50 6Q55 45 94 50 55 55 50 94 45 55 6 50 45 45 50 6Z" fill={P.cream} stroke={P.gold} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M82 12q1.5 9 10 10-8.5 1-10 10-1.5-9-10-10 8.5-1 10-10Z" fill={P.pink} />
      </>
    ),
  },
  {
    id: "cloud",
    svg: (
      <path d="M26 74h50a16 16 0 0 0 2-32 22 22 0 0 0-41-8 17 17 0 0 0-11 40Z" fill="#fff" stroke={P.pink} strokeWidth="4" strokeLinejoin="round" />
    ),
  },
  {
    id: "cherry",
    svg: (
      <>
        <path d="M34 62C38 40 48 24 62 12M66 64C64 44 64 28 62 12" fill="none" stroke="#7aa874" strokeWidth="4" strokeLinecap="round" />
        <path d="M62 12c10-4 22 0 26 8-10 4-20 2-26-8Z" fill={P.leaf} stroke="#7aa874" strokeWidth="3" />
        <circle cx="32" cy="72" r="16" fill={P.pinkDeep} />
        <circle cx="68" cy="74" r="16" fill={P.pinkDeep} />
        <circle cx="26" cy="66" r="4" fill="#fff" opacity=".7" />
        <circle cx="62" cy="68" r="4" fill="#fff" opacity=".7" />
      </>
    ),
  },
  {
    id: "strawberry",
    svg: (
      <>
        <path d="M50 92C28 78 16 58 20 42c3-12 18-16 30-12 12-4 27 0 30 12 4 16-8 36-30 50Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" />
        <path d="M30 30l8-12 7 9 5-13 5 13 7-9 8 12c-12 6-28 6-40 0Z" fill={P.leaf} stroke="#7aa874" strokeWidth="3" strokeLinejoin="round" />
        {[[36, 48], [50, 44], [64, 48], [42, 62], [58, 62], [50, 76]].map(([x, y]) => (
          <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2" ry="3" fill={P.cream} />
        ))}
      </>
    ),
  },
  {
    id: "balloon",
    svg: (
      <>
        <path d="M50 70c-2 8 4 12 0 18s2 8 0 10" fill="none" stroke={P.ink} strokeWidth="2" opacity=".5" />
        <ellipse cx="50" cy="38" rx="26" ry="31" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" />
        <path d="M45 72h10l-5-5Z" fill={P.pinkDeep} />
        <ellipse cx="40" cy="26" rx="6" ry="9" fill="#fff" opacity=".6" transform="rotate(-25 40 26)" />
      </>
    ),
  },
  {
    id: "cake",
    svg: (
      <>
        <rect x="20" y="52" width="60" height="34" rx="6" fill={P.cream} stroke={P.pinkDeep} strokeWidth="3.5" />
        <path d="M20 60c8 6 12-4 20 2s12-4 20 2 12-4 20 2v-8c0-6-4-10-10-10H30c-6 0-10 4-10 10Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3" strokeLinejoin="round" />
        <rect x="46" y="28" width="8" height="18" rx="3" fill={P.soft} stroke={P.pinkDeep} strokeWidth="2.5" />
        <path d="M50 10c6 7 6 12 0 15-6-3-6-8 0-15Z" fill={P.gold} stroke="#e0a94a" strokeWidth="2" />
      </>
    ),
  },
  {
    id: "butterfly",
    svg: (
      <>
        <path d="M48 48C36 20 10 18 12 36s22 18 36 12Z" fill={P.soft} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M52 48C64 20 90 18 88 36s-22 18-36 12Z" fill={P.soft} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M48 52C34 58 22 76 34 82s14-14 14-30Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M52 52C66 58 78 76 66 82s-14-14-14-30Z" fill={P.pink} stroke={P.pinkDeep} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="46" y="32" width="8" height="40" rx="4" fill={P.ink} />
        <path d="M48 32c-2-8-6-12-10-14M52 32c2-8 6-12 10-14" fill="none" stroke={P.ink} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "moon",
    svg: (
      <>
        <path d="M62 12a38 38 0 1 0 26 52A30 30 0 0 1 62 12Z" fill={P.cream} stroke={P.gold} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="40" cy="48" r="4" fill={P.gold} opacity=".5" />
        <circle cx="50" cy="70" r="3" fill={P.gold} opacity=".5" />
      </>
    ),
  },
];

const byId = new Map(STICKERS.map((s) => [s.id, s]));

export function StickerSvg({ id, className }: { id: string; className?: string }) {
  const s = byId.get(id);
  if (!s) return null;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {s.svg}
    </svg>
  );
}
