"use client";

// Котик выглядывает из-за края экрана. Если ткнуть — подпрыгивает и выпускает сердечки.
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assetUrl, ASSETS } from "@/content/assets";
import { cn } from "../ui";

type Edge = "left" | "right" | "bottom-left" | "bottom-right";

export function PeekCat({
  cat,
  edge,
  top = "60%",
  size = 120,
  delay = 0.8,
  className,
}: {
  cat: string; // id из assets: cat-wink, cat-shock…
  edge: Edge;
  top?: string; // для left/right — высота
  size?: number;
  delay?: number;
  className?: string;
}) {
  const [hearts, setHearts] = useState<number[]>([]);
  if (!ASSETS[cat]) return null;

  // откуда выезжает и под каким углом
  const conf = {
    left: { pos: { left: 0, top }, from: { x: "-100%", rotate: 0 }, to: { x: "-38%", rotate: 22 } },
    right: { pos: { right: 0, top }, from: { x: "100%", rotate: 0 }, to: { x: "38%", rotate: -22 } },
    "bottom-left": { pos: { left: "4%", bottom: 0 }, from: { y: "100%", rotate: 0 }, to: { y: "40%", rotate: 8 } },
    "bottom-right": { pos: { right: "4%", bottom: 0 }, from: { y: "100%", rotate: 0 }, to: { y: "40%", rotate: -8 } },
  }[edge];

  const boop = () => {
    const id = Date.now();
    setHearts((h) => [...h, id]);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1200);
  };

  return (
    <motion.button
      type="button"
      aria-label="cat"
      onClick={boop}
      className={cn("fixed z-20 touch-manipulation", className)}
      style={{ ...conf.pos, width: size }}
      initial={conf.from}
      animate={conf.to}
      whileTap={{ scale: 0.9 }}
      transition={{ delay, type: "spring", damping: 12, stiffness: 110 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetUrl(cat)} alt="" draggable={false} className="w-full drop-shadow-[0_6px_8px_rgba(90,30,50,.25)]" />
      <AnimatePresence>
        {hearts.map((h) =>
          [0, 1, 2].map((k) => (
            <motion.svg
              key={`${h}-${k}`}
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-1/2 top-1/4 size-6 fill-[#e88aa8]"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
              animate={{ x: (k - 1) * 30, y: -70 - k * 12, opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            >
              <path d="M12 21C6 17 2 13 2 8.5 2 5.4 4.4 3 7.3 3c1.9 0 3.6 1 4.7 2.6C13.1 4 14.8 3 16.7 3 19.6 3 22 5.4 22 8.5 22 13 18 17 12 21Z" />
            </motion.svg>
          )),
        )}
      </AnimatePresence>
    </motion.button>
  );
}
