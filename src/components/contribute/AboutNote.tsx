"use client";

// Записка-пояснение вверху раздела: розовый листок с котиком, который выглядывает из-за угла
import { motion } from "framer-motion";
import { assetThumbUrl } from "@/content/assets";

export function AboutNote({ text, cat }: { text: string; cat: string }) {
  return (
    <motion.div
      className="relative mt-3 rotate-[-1deg] rounded-2xl bg-[#fff6f9] px-4 py-3 pr-20 shadow-[0_6px_14px_-8px_rgba(122,59,82,.45)] ring-2 ring-pink-soft"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* скотч сверху */}
      <span className="absolute -top-2.5 left-6 h-5 w-14 rotate-[-6deg] bg-[#f6d9a8]/80" />
      <p className="text-[0.95rem] font-semibold leading-snug text-rose-ink/85">{text}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src={assetThumbUrl(cat)}
        alt=""
        className="pointer-events-none absolute -right-2 -top-6 h-[4.5rem] w-auto max-w-20 object-contain drop-shadow-[0_4px_5px_rgba(90,30,50,.25)]"
        initial={{ rotate: 0, y: 12, opacity: 0 }}
        animate={{ rotate: 10, y: 0, opacity: 1 }}
        transition={{ delay: 0.35, type: "spring", damping: 10 }}
      />
    </motion.div>
  );
}
