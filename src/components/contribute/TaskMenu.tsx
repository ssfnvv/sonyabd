"use client";

// Меню выбора: что друг хочет добавить. Каждая плитка — с пояснением и своим котиком.
import { motion } from "framer-motion";
import { copy } from "@/content/copy";
import { assetThumbUrl } from "@/content/assets";
import { Screen } from "../ui";

const t = copy.contribute;

export type Task = "card" | "voice" | "quiz" | "prediction" | "video";

// котик и цвет плитки для каждого раздела
export const TASK_CATS: Record<Task, string> = {
  card: "cat-calico",
  voice: "cat-glasses",
  quiz: "cat-shock",
  prediction: "cat-cupcake",
  video: "cat-wink",
};
const TINTS: Record<Task, string> = {
  card: "#fde4ec",
  voice: "#fff0dc",
  quiz: "#e6f0fb",
  prediction: "#f1e6fb",
  video: "#e3f4e8",
};
const ORDER: Task[] = ["card", "voice", "quiz", "prediction", "video"];

export function TaskMenu({ onPick }: { onPick: (task: Task) => void }) {
  return (
    <Screen>
      <h2 className="mt-6 text-center font-display text-2xl font-bold leading-tight">{t.menuTitle}</h2>
      <div className="flex flex-col gap-4">
        {ORDER.map((id, i) => (
          <motion.button
            key={id}
            onClick={() => onPick(id)}
            initial={{ opacity: 0, x: i % 2 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, type: "spring", damping: 16 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex items-center gap-3 overflow-visible rounded-[1.75rem] py-4 pl-4 pr-24 text-left ring-2 ring-pink"
            style={{ background: TINTS[id], rotate: `${(i % 2 ? 1 : -1) * 0.8}deg` }}
          >
            <span className="flex flex-col gap-1">
              <span className="font-display text-lg font-bold leading-tight">{t.sections[id]}</span>
              <span className="text-sm leading-snug text-rose-ink/75">{t.about[id]}</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src={assetThumbUrl(TASK_CATS[id])}
              alt=""
              className="pointer-events-none absolute -right-1 top-1/2 h-[5.5rem] w-auto max-w-[6.5rem] -translate-y-1/2 object-contain drop-shadow-[0_4px_5px_rgba(90,30,50,.22)]"
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 2.6 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>
        ))}
      </div>
    </Screen>
  );
}
