"use client";

// Вход для друга: только имя, без паролей
import { useState } from "react";
import { motion } from "framer-motion";
import { copy } from "@/content/copy";
import { registerFriend, saveFriend, type Friend } from "@/lib/client-api";
import { StickerSvg } from "../stickers";
import { Button, Input, Note } from "../ui";

const t = copy.contribute;

export function NameGate({ onEnter }: { onEnter: (f: Friend) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(t.nameError);
    setBusy(true);
    setError(null);
    try {
      const f = await registerFriend(name.trim());
      saveFriend(f);
      onEnter(f);
    } catch {
      setError(t.uploadError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={go}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-10"
    >
      {/* Парящие стикеры над заголовком */}
      <div className="relative mx-auto h-28 w-56">
        {[
          { id: "heart", cls: "left-0 top-6 size-16 -rotate-12", d: 0 },
          { id: "cake", cls: "left-1/2 top-0 size-24 -translate-x-1/2", d: 0.4 },
          { id: "sparkle", cls: "right-0 top-8 size-14 rotate-12", d: 0.8 },
        ].map((s) => (
          <motion.div
            key={s.id}
            className={`absolute ${s.cls}`}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: s.d, ease: "easeInOut" }}
          >
            <StickerSvg id={s.id} className="size-full" />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-3xl font-bold leading-tight">{t.title}</h1>
        <p className="leading-relaxed text-rose-ink/80">{t.subtitle}</p>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.namePlaceholder}
        maxLength={60}
        autoComplete="given-name"
        className="text-center text-lg"
      />
      {error && <Note tone="error">{error}</Note>}
      <Button type="submit" loading={busy}>
        {t.nameNext}
      </Button>
    </motion.form>
  );
}
