"use client";

// Меню выбора: что друг хочет добавить
import { motion } from "framer-motion";
import { HelpCircle, ImagePlus, Mail, Mic, Video } from "lucide-react";
import { copy } from "@/content/copy";
import { Screen } from "../ui";

const t = copy.contribute;

export type Task = "card" | "voice" | "quiz" | "prediction" | "video";

const ITEMS: { id: Task; Icon: typeof Mic; tint: string }[] = [
  { id: "card", Icon: ImagePlus, tint: "#fde4ec" },
  { id: "voice", Icon: Mic, tint: "#fff0dc" },
  { id: "quiz", Icon: HelpCircle, tint: "#fde4ec" },
  { id: "prediction", Icon: Mail, tint: "#fff0dc" },
  { id: "video", Icon: Video, tint: "#fde4ec" },
];

export function TaskMenu({ onPick }: { onPick: (task: Task) => void }) {
  return (
    <Screen>
      <h2 className="mt-6 text-center font-display text-2xl font-bold leading-tight">{t.menuTitle}</h2>
      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map(({ id, Icon, tint }, i) => (
          <motion.button
            key={id}
            onClick={() => onPick(id)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-3 rounded-[2rem] bg-white/85 px-3 py-6 ring-2 ring-pink ${
              i === ITEMS.length - 1 ? "col-span-2" : ""
            }`}
          >
            <span className="grid size-14 place-items-center rounded-full" style={{ background: tint }}>
              <Icon className="size-7" />
            </span>
            <span className="text-center font-bold leading-tight">{t.sections[id]}</span>
          </motion.button>
        ))}
      </div>
    </Screen>
  );
}
