"use client";

// Текст из «вырезанных из журнала» букв: каждая буква на своём клочке бумаги,
// со своим шрифтом, цветом и наклоном. Стиль букв зависит только от позиции и символа,
// поэтому при каждой загрузке надпись выглядит одинаково.
import "@fontsource/rubik-mono-one/cyrillic-400.css";
import "@fontsource/rubik-mono-one/latin-400.css";
import "@fontsource/russo-one/cyrillic-400.css";
import "@fontsource/russo-one/latin-400.css";
import "@fontsource/playfair-display/cyrillic-700.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/playfair-display/cyrillic-700-italic.css";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { cn } from "../ui";

type Style = { font: string; bg: string; fg: string; italic?: boolean; weight?: number; size?: number };

const STYLES: Style[] = [
  { font: '"Rubik Mono One"', bg: "#e94b6b", fg: "#fff", size: 0.85 },
  { font: '"Playfair Display"', bg: "#ffffff", fg: "#1b1b1b", italic: true, weight: 700 },
  { font: '"Russo One"', bg: "#1f1a1c", fg: "#f9c5d5" },
  { font: "Comfortaa", bg: "#f6cf7a", fg: "#7a3b52", weight: 700 },
  { font: "Georgia, serif", bg: "#bfe3d0", fg: "#1f5c45", weight: 700 },
  { font: '"Caveat"', bg: "#fde4ec", fg: "#c2185b", weight: 700, size: 1.25 },
  { font: '"Rubik Mono One"', bg: "#2f6fb3", fg: "#fff", size: 0.85 },
  { font: '"Playfair Display"', bg: "#fff3e3", fg: "#d9628a", weight: 700 },
  { font: '"Nunito Variable"', bg: "#ffffff", fg: "#e94b6b", weight: 900 },
  { font: "Georgia, serif", bg: "#ece7dc", fg: "#222", italic: true },
  { font: '"Russo One"', bg: "#f7a8c0", fg: "#ffffff" },
  { font: "Comfortaa", bg: "#cfe0f5", fg: "#23466e", weight: 700 },
];

// Детерминированный «рандом» по строке
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  // перемешиваем биты, иначе похожие строки дают похожие числа
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export function RansomText({ text, size = 40, className }: { text: string; size?: number; className?: string }) {
  const words = text.split(/(\s+)/);
  let idx = 0;
  return (
    <span className={cn("inline-flex flex-wrap items-center justify-center gap-y-2", className)} aria-label={text}>
      {words.map((word, wi) =>
        /^\s+$/.test(word) ? (
          <span key={wi} style={{ width: size * 0.35 }} aria-hidden />
        ) : (
          // слово не разрывается при переносе строки
          <span key={wi} className="inline-flex whitespace-nowrap" aria-hidden>
            {[...word].map((ch) => {
              const i = idx++;
              const r = (k: number) => hash(`${text}|${i}|${ch}|${k}`);
              const st = STYLES[Math.floor(r(1) * STYLES.length)];
              const rot = (r(2) - 0.5) * 14;
              const dy = (r(3) - 0.5) * 6;
              const sc = (0.88 + r(4) * 0.28) * (st.size ?? 1);
              const padX = 3 + r(5) * 5;
              const padY = 1 + r(6) * 5;
              // неровный край вырезки
              const clip = `polygon(${r(7) * 6}% ${r(8) * 6}%, ${100 - r(9) * 6}% 0%, 100% ${100 - r(10) * 7}%, ${r(11) * 5}% 100%)`;
              return (
                <span
                  key={i}
                  className="mx-[1px] inline-block leading-none shadow-[1px_2px_2px_rgba(0,0,0,.18)]"
                  style={{
                    fontFamily: st.font,
                    fontStyle: st.italic ? "italic" : undefined,
                    fontWeight: st.weight,
                    background: st.bg,
                    color: st.fg,
                    fontSize: size * sc,
                    padding: `${padY}px ${padX}px`,
                    transform: `translateY(${dy}px) rotate(${rot}deg)`,
                    clipPath: clip,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        ),
      )}
    </span>
  );
}
