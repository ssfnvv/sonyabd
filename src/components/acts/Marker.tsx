"use client";

// Жёлтый маркер «от руки» как на референсе: штрихи-искорки, звёздочки, стрелки, волны,
// кружочки, фигурки. Каждый каракуль сам прорисовывается, когда попадает в кадр.
import { motion } from "framer-motion";

export const MARKER = "#FFC21A";

// Пути в квадрате 60×60
const SHAPES: Record<string, string[]> = {
  // «Н»-искорка: две вертикали с перекладиной и чёрточками
  tick: ["M20 8 L18 52", "M40 6 L42 50", "M10 30 L52 27", "M8 14 L14 18", "M50 12 L45 17"],
  sparkle2: ["M22 10 Q24 26 38 28 Q24 30 22 46 Q20 30 6 28 Q20 26 22 10", "M46 34 Q47 41 54 42 Q47 43 46 50 Q45 43 38 42 Q45 41 46 34"],
  star: ["M30 6 L35 24 L54 24 L39 35 L45 54 L30 42 L15 54 L21 35 L6 24 L25 24 Z"],
  burst: ["M30 4 L30 16", "M30 44 L30 56", "M4 30 L16 30", "M44 30 L56 30", "M12 12 L20 20", "M40 40 L48 48", "M48 12 L40 20", "M12 48 L20 40"],
  sun: ["M30 30 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", "M27 29 l0 1 M33 29 l0 1", "M26 34 Q30 37 34 34", "M30 6 l0 8 M30 46 l0 8 M6 30 l8 0 M46 30 l8 0 M13 13 l6 6 M41 41 l6 6 M47 13 l-6 6 M13 47 l6 -6"],
  arrow: ["M6 14 C22 12 38 22 44 44", "M34 40 L45 46 L48 33"],
  arrow2: ["M54 10 C40 14 20 30 14 50", "M10 38 L13 51 L26 47"],
  wave: ["M2 30 Q9 18 16 30 T30 30 T44 30 T58 30"],
  zigzag: ["M4 40 L14 20 L24 40 L34 20 L44 40 L54 20"],
  shapes: ["M8 52 L20 30 L32 52 Z", "M46 20 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0", "M36 36 L52 32 L56 48 L40 52 Z"],
  excl: ["M10 8 L18 40", "M26 6 L30 38", "M42 8 L38 40", "M18 50 l0 1 M30 48 l0 1 M38 50 l0 1"],
  dashes: ["M6 50 Q20 10 54 8"],
  crown: ["M8 46 L12 18 L22 32 L30 12 L38 32 L48 18 L52 46 Z"],
  heart: ["M30 50 C12 38 6 28 10 19 C14 10 25 10 30 20 C35 10 46 10 50 19 C54 28 48 38 30 50"],
  circle: ["M30 8 C50 6 56 26 50 42 C44 56 16 56 9 40 C3 26 12 9 32 7"],
  smile: ["M30 6 a24 24 0 1 0 0.1 0", "M21 24 l0 4 M39 24 l0 4", "M19 36 Q30 46 41 36"],
};

export type MarkerKind = keyof typeof SHAPES;
export const MARKER_KINDS = Object.keys(SHAPES) as MarkerKind[];

export function Marker({
  kind,
  className,
  style,
  size = 56,
  color = MARKER,
  rotate = 0,
  delay = 0,
}: {
  kind: MarkerKind;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  color?: string;
  rotate?: number;
  delay?: number;
}) {
  const dashed = kind === "dashes";
  return (
    <motion.svg
      viewBox="0 0 60 60"
      className={`pointer-events-none absolute overflow-visible ${className ?? ""}`}
      style={{ width: size, height: size, rotate, ...style }}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-5% 0px" }}
      aria-hidden
    >
      {SHAPES[kind].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dashed ? "5 7" : undefined}
          variants={dashed ? { hidden: { opacity: 0 }, shown: { opacity: 1 } } : { hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
          transition={{ delay: delay + i * 0.12, duration: 0.55, ease: "easeOut" }}
        />
      ))}
    </motion.svg>
  );
}
