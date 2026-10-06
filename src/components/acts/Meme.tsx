"use client";

// Мемы владелицы. Два вида:
//  • «карточка» — прямоугольная картинка с подписью: белая рамочка, тень и кусочек скотча;
//  • «наклейка» — вырезанный персонаж без фона, просто с тенью.
// Появляются с пружинкой и чуть покачиваются. Нажатия не перехватывают.
import { motion } from "framer-motion";
import { assetUrl, ASSETS } from "@/content/assets";
import { cn } from "../ui";

// мемы-карточки (остальные — вырезанные наклейки)
const CARDS = new Set([
  "meme-ura", "meme-bro", "meme-zhit", "meme-niche", "meme-smugcats", "meme-beda", "meme-unicorn",
  "meme-crycats", "meme-romance", "meme-playlist", "meme-hehe", "meme-nothehe",
]);

export const isMemeCard = (id: string) => CARDS.has(id);

export function Meme({
  id,
  className,
  style,
  rot = 0,
  delay = 0,
  sway = true,
  inView = false, // появляться, когда доскроллили (для длинных экранов)
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  rot?: number;
  delay?: number;
  sway?: boolean;
  inView?: boolean;
}) {
  const a = ASSETS[id];
  if (!a) return null;
  const card = isMemeCard(id);
  const shown = { scale: 1, opacity: 1, rotate: rot };
  return (
    <motion.div
      className={cn("pointer-events-none absolute z-20", className)}
      style={style}
      initial={{ scale: 0.3, opacity: 0, rotate: rot - 25 }}
      {...(inView ? { whileInView: shown, viewport: { once: true, margin: "-8% 0px" } } : { animate: shown })}
      transition={{ delay, type: "spring", damping: 10, stiffness: 180 }}
    >
      <motion.div
        animate={sway ? { rotate: [-1.5, 1.5, -1.5] } : undefined}
        transition={{ duration: 3.5 + (id.length % 3), repeat: Infinity, ease: "easeInOut" }}
        className={cn("relative", card ? "bg-white p-[5px] pb-[7px] shadow-[0_8px_16px_-6px_rgba(90,30,50,.45)]" : "drop-shadow-[0_6px_8px_rgba(90,30,50,.28)]")}
      >
        {card && ASSETS["tape"] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl("tape")} alt="" className="absolute -top-3 left-1/2 z-10 w-[42%] -translate-x-1/2 rotate-[-4deg] opacity-90" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(id)} alt="" draggable={false} className="block w-full" style={{ aspectRatio: `${a.w} / ${a.h}` }} />
      </motion.div>
    </motion.div>
  );
}
