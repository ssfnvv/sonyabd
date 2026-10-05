"use client";

// Приватная часть для друзей: имя → меню → один из пяти разделов → спасибо → меню
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { loadFriend, type Friend } from "@/lib/client-api";
import { NameGate } from "@/components/contribute/NameGate";
import { TaskMenu, type Task } from "@/components/contribute/TaskMenu";
import { CardEditor } from "@/components/contribute/CardEditor";
import { VoiceRecorder } from "@/components/contribute/VoiceRecorder";
import { QuizForm } from "@/components/contribute/QuizForm";
import { PredictionForm } from "@/components/contribute/PredictionForm";
import { VideoRecorder } from "@/components/contribute/VideoRecorder";
import { ThanksScreen } from "@/components/contribute/ThanksScreen";

type ScreenId = "menu" | Task | "thanks";

export default function ContributePage() {
  const [friend, setFriend] = useState<Friend | null>(null);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<ScreenId>("menu");

  // Вернувшегося друга узнаём по сохранённому в браузере имени
  useEffect(() => {
    setFriend(loadFriend());
    setReady(true);
  }, []);

  useEffect(() => window.scrollTo({ top: 0 }), [screen]);

  if (!ready) return <main className="bg-dreamy min-h-dvh" />;

  const toMenu = () => setScreen("menu");
  const toThanks = () => setScreen("thanks");

  return (
    <main className="bg-dreamy min-h-dvh">
      <AnimatePresence mode="wait">
        {!friend ? (
          <NameGate key="gate" onEnter={setFriend} />
        ) : screen === "menu" ? (
          <TaskMenu key="menu" onPick={setScreen} />
        ) : screen === "card" ? (
          <CardEditor key="card" friend={friend} onBack={toMenu} onDone={toThanks} />
        ) : screen === "voice" ? (
          <VoiceRecorder key="voice" friend={friend} onBack={toMenu} onDone={toThanks} />
        ) : screen === "quiz" ? (
          <QuizForm key="quiz" friend={friend} onBack={toMenu} onDone={toThanks} />
        ) : screen === "prediction" ? (
          <PredictionForm key="prediction" friend={friend} onBack={toMenu} onDone={toThanks} />
        ) : screen === "video" ? (
          <VideoRecorder key="video" friend={friend} onBack={toMenu} onDone={toThanks} />
        ) : (
          <ThanksScreen key="thanks" onBack={toMenu} />
        )}
      </AnimatePresence>
    </main>
  );
}
