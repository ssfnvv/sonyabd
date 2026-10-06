"use client";

// Общая обёртка актов: кнопка «назад» к прошлому акту (только иконка) и плавное появление
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { copy } from "@/content/copy";
import { cn } from "../ui";
import { DemoBadge } from "./DemoBadge";

export function ActShell({
  back,
  dark,
  className,
  children,
}: {
  back?: string; // куда ведёт «назад»
  dark?: boolean; // светлая иконка на тёмном фоне
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className={cn("relative min-h-dvh overflow-hidden", className)}>
      <DemoBadge />
      {back && (
        <Link
          href={back}
          aria-label={copy.contribute.back}
          className={cn(
            "fixed left-4 top-4 z-30 grid size-11 place-items-center rounded-full backdrop-blur-sm active:scale-90",
            dark ? "bg-white/10 text-[#fde4ec] ring-1 ring-white/20" : "bg-white/70 text-rose-ink ring-2 ring-pink",
          )}
        >
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        {children}
      </motion.div>
    </main>
  );
}
