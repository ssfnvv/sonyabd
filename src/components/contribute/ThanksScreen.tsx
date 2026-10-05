"use client";

// Экран после отправки: короткая благодарность и возврат в меню
import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { copy } from "@/content/copy";
import { StickerSvg } from "../stickers";
import { Button } from "../ui";

const t = copy.contribute;

export function ThanksScreen({ onBack }: { onBack: () => void }) {
  // Немного розового конфетти в благодарность
  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f9c5d5", "#e88aa8", "#fff3e3", "#f6cf7a"],
      disableForReducedMotion: true,
    });
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-6 text-center"
    >
      <motion.div
        initial={{ rotate: -20, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="size-32"
      >
        <StickerSvg id="heart" className="size-full" />
      </motion.div>
      <p className="font-display text-2xl font-bold leading-snug">{t.thanks}</p>
      <Button onClick={onBack} className="w-full">
        {t.back}
      </Button>
    </motion.section>
  );
}
