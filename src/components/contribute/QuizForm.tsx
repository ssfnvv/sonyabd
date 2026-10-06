"use client";

// Викторина, два раунда. Друг может заполнить любой из них или оба.
// Раунд 1: факт/воспоминание — Соня угадывает автора.
// Раунд 2: вопрос о Соне, один верный ответ и три неверных.
import { useState } from "react";
import { Check } from "lucide-react";
import { copy } from "@/content/copy";
import { submit, type Friend } from "@/lib/client-api";
import { Button, Input, Note, Screen, TextArea } from "../ui";
import { AboutNote } from "./AboutNote";
import { TASK_CATS } from "./TaskMenu";


const t = copy.contribute;

export function QuizForm({ friend, onBack, onDone }: { friend: Friend; onBack: () => void; onDone: () => void }) {
  return (
    <Screen title={t.sections.quiz} onBack={onBack} backLabel={t.back}>
      <AboutNote text={t.about.quiz} cat={TASK_CATS.quiz} />
      <RoundOne friend={friend} onDone={onDone} />
      <RoundTwo friend={friend} onDone={onDone} />
    </Screen>
  );
}

function Block({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col gap-3 rounded-[2rem] bg-white/85 p-5 pt-7 ring-2 ring-pink">
      <span className="absolute -top-4 left-5 grid size-8 place-items-center rounded-full bg-pink-deep font-display font-bold text-white">
        {n}
      </span>
      {children}
    </div>
  );
}

function RoundOne({ friend, onDone }: { friend: Friend; onDone: () => void }) {
  const [fact, setFact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!fact.trim()) return setError(t.fillAllFields);
    setBusy(true);
    setError(null);
    try {
      await submit("quiz", { friendId: friend.id, round: 1, fact });
      onDone();
    } catch {
      setError(t.uploadError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Block n={1}>
      <TextArea value={fact} maxLength={500} onChange={(e) => setFact(e.target.value)} placeholder={t.quizRound1} />
      {error && <Note tone="error">{error}</Note>}
      <Button onClick={send} loading={busy}>
        {t.voiceButtons.send}
      </Button>
    </Block>
  );
}

function RoundTwo({ friend, onDone }: { friend: Friend; onDone: () => void }) {
  const [question, setQuestion] = useState("");
  const [correct, setCorrect] = useState("");
  const [wrong, setWrong] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!question.trim() || !correct.trim() || wrong.some((w) => !w.trim())) return setError(t.fillAllFields);
    setBusy(true);
    setError(null);
    try {
      await submit("quiz", { friendId: friend.id, round: 2, question, correct, wrong });
      onDone();
    } catch {
      setError(t.uploadError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Block n={2}>
      <TextArea
        value={question}
        maxLength={300}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t.quizRound2Question}
        className="min-h-20"
      />
      <div className="relative">
        <Input
          value={correct}
          maxLength={150}
          onChange={(e) => setCorrect(e.target.value)}
          placeholder={t.quizRound2Correct}
          className="border-[#9fd3a9] pr-11"
        />
        <Check className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#5aa86a]" />
      </div>
      <p className="mt-1 text-sm font-semibold text-rose-ink/70">{t.quizRound2Wrong}</p>
      {wrong.map((w, i) => (
        <Input
          key={i}
          value={w}
          maxLength={150}
          onChange={(e) => setWrong((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
        />
      ))}
      {error && <Note tone="error">{error}</Note>}
      <Button onClick={send} loading={busy}>
        {t.voiceButtons.send}
      </Button>
    </Block>
  );
}
