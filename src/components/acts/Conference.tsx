"use client";

// Конф-колл: участники — вышитые нашивки «HELLO, I AM» с именем, написанным маркером.
// Нашивки разбросаны по столу; тот, кто говорит, приподнимается и «болтает»,
// а на уголке выскакивает рыжий котик с эмоцией. Вокруг — конфета, бантик и тюльпаны.
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assetUrl, ASSETS } from "@/content/assets";
import { hash } from "./RansomText";

type Person = { id: string; name: string };

// рыжие котики-эмоции, вырезанные из стикерпака
const REACTIONS = Array.from({ length: 28 }, (_, i) => `ocat-${String(i + 1).padStart(2, "0")}`);

export function Conference({ people, speaking }: { people: Person[]; speaking: number }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const reactions = REACTIONS.filter((id) => ASSETS[id]);

  // говорящий всегда в кадре
  useEffect(() => {
    if (speaking >= 0) refs.current[speaking]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [speaking]);

  const tag = ASSETS["nametag"];

  return (
    <div className="relative w-full pt-8">
      {/* декор вокруг */}
      <Decor id="meme-dog" className="-left-5 -top-10 w-20" rot={-10} />
      <Decor id="bow-halftone" className="-right-4 -top-8 w-20" rot={14} delay={0.3} />
      <Decor id="tulips" className="-bottom-10 -left-8 w-28" rot={-8} delay={0.6} />
      <Decor id="meme-shrek" className="-bottom-14 -right-5 w-24" rot={6} delay={0.9} />

      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {people.map((p, i) => {
          const r = (k: string) => hash(p.id + k);
          const tilt = (r("t") - 0.5) * 12;
          const on = i === speaking;
          const cat = reactions.length ? reactions[Math.floor(r("c") * reactions.length)] : null;
          return (
            <motion.div
              key={p.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="relative"
              style={{ zIndex: on ? 20 : 1, marginTop: i % 2 ? 22 : 0 }}
              initial={{ y: -40, opacity: 0, rotate: tilt - 20, scale: 1.2 }}
              animate={{
                y: on ? -6 : 0,
                opacity: 1,
                rotate: on ? [tilt - 3, tilt + 3, tilt - 3] : tilt,
                scale: on ? 1.12 : speaking >= 0 ? 0.94 : 1,
              }}
              transition={{
                rotate: on ? { duration: 0.35, repeat: Infinity } : { type: "spring", damping: 12 },
                default: { type: "spring", damping: 13, delay: speaking < 0 ? i * 0.08 : 0 },
              }}
            >
              <div
                className="relative w-full"
                style={{
                  aspectRatio: tag ? `${tag.w} / ${tag.h}` : "2 / 1",
                  filter: on
                    ? "drop-shadow(0 12px 14px rgba(150,30,50,.35))"
                    : speaking >= 0
                      ? "drop-shadow(0 4px 5px rgba(90,30,50,.2)) saturate(.75)"
                      : "drop-shadow(0 6px 7px rgba(90,30,50,.25))",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl("nametag")} alt="" draggable={false} className="absolute inset-0 size-full" />
                {/* имя маркером в белом поле нашивки */}
                <span
                  className="font-hand absolute inset-x-[6%] top-[37%] flex h-[38%] items-center justify-center truncate text-center text-[1.65rem] font-bold leading-none text-[#25304d]"
                  style={{ rotate: `${(r("n") - 0.5) * 6}deg` }}
                >
                  {p.name}
                </span>
              </div>

              {/* котик-эмоция у говорящего */}
              <AnimatePresence>
                {on && cat && (
                   
                  <motion.img
                    key={cat}
                    src={assetUrl(cat)}
                    alt=""
                    className="pointer-events-none absolute -right-4 -top-12 w-20 drop-shadow-[0_6px_6px_rgba(90,30,50,.3)]"
                    initial={{ scale: 0, rotate: -30, y: 20 }}
                    animate={{ scale: 1, rotate: 10, y: 0 }}
                    exit={{ scale: 0, rotate: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 9, stiffness: 260 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Decor({ id, className, rot, delay = 0 }: { id: string; className: string; rot: number; delay?: number }) {
  if (!ASSETS[id]) return null;
  return (
     
    <motion.img
      src={assetUrl(id)}
      alt=""
      className={`pointer-events-none absolute z-0 drop-shadow-[0_5px_6px_rgba(90,30,50,.2)] ${className}`}
      initial={{ scale: 0, rotate: rot - 30 }}
      animate={{ scale: 1, rotate: [rot - 4, rot + 4, rot - 4] }}
      transition={{ scale: { delay, type: "spring", damping: 10 }, rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
    />
  );
}
