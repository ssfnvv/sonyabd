"use client";

// Лендинг-портал: тёмный экран, частицы складываются в имя, кнопка «войти»
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { copy } from "@/content/copy";
import { ParticleName } from "@/components/acts/ParticleName";
import { unlockAudio } from "@/lib/sound";

const t = copy.portal;

export default function Portal() {
  const router = useRouter();
  const [formed, setFormed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const enter = () => {
    unlockAudio(); // разблокируем звук на iPhone — дальше «дзынь» в полночь сработает
    setLeaving(true);
    setTimeout(() => router.push("/act1"), 700);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#3a1f30_0%,#1f1019_55%,#140a10_100%)]">
      <ParticleName text={t.name} onFormed={() => setFormed(true)} />

      <AnimatePresence>
        {formed && !leaving && (
          <motion.div
            className="fixed inset-x-0 bottom-[16dvh] flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.button
              onClick={enter}
              whileTap={{ scale: 0.94 }}
              className="rounded-full border border-[#f9c5d5]/60 bg-[#f9c5d5]/10 px-12 py-4 font-display text-lg font-bold tracking-wide text-[#fde4ec] shadow-[0_0_40px_-6px_#f9c5d5aa] backdrop-blur-sm"
              animate={{ boxShadow: ["0 0 30px -8px #f9c5d588", "0 0 50px -4px #f9c5d5cc", "0 0 30px -8px #f9c5d588"] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              {t.enter}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* вспышка при входе */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            className="fixed inset-0 bg-[#fde4ec]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeIn" }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
