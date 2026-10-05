"use client";

// Запечатанное предсказание: Соня откроет его в финале
import { useState } from "react";
import { copy } from "@/content/copy";
import { submit, type Friend } from "@/lib/client-api";
import { Button, Note, Screen, TextArea } from "../ui";

const t = copy.contribute;

export function PredictionForm({ friend, onBack, onDone }: { friend: Friend; onBack: () => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return setError(t.fillAllFields);
    setBusy(true);
    setError(null);
    try {
      await submit("prediction", { friendId: friend.id, text });
      onDone();
    } catch {
      setError(t.uploadError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t.sections.prediction} onBack={onBack} backLabel={t.back}>
      {/* «Конверт»: кремовый лист с розовой печатью */}
      <div className="relative rounded-[2rem] bg-[#fffaf3] p-5 pb-10 shadow-[0_10px_30px_-12px_#e88aa866] ring-2 ring-cream-deep">
        <TextArea
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.predictionPlaceholder}
          className="min-h-48 border-none bg-transparent px-1 focus:border-none"
        />
        <span className="absolute -bottom-6 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-full bg-pink-deep shadow-md ring-4 ring-[#f3a7bf]">
          <svg viewBox="0 0 24 24" className="size-6 fill-white" aria-hidden>
            <path d="M12 21C6 17 2 13 2 8.5 2 5.4 4.4 3 7.3 3c1.9 0 3.6 1 4.7 2.6C13.1 4 14.8 3 16.7 3 19.6 3 22 5.4 22 8.5 22 13 18 17 12 21Z" />
          </svg>
        </span>
      </div>
      <div className="h-4" />
      {error && <Note tone="error">{error}</Note>}
      <Button onClick={send} loading={busy}>
        {t.voiceButtons.send}
      </Button>
    </Screen>
  );
}
