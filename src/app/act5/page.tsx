"use client";

// Акт 5: викторина «угадай кто», два раунда.
// Раунд 1 — факт от друга, угадать автора. Раунд 2 — вопрос о Соне.
// Вопрос — на клочке бумаги, ответы — четыре полароида. Верный ответ «припечатывает»
// сургучное сердце, неверный — перечёркивается маркером.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { shuffle } from "@/lib/mix";
import { assetUrl, ASSETS } from "@/content/assets";
import { ActShell } from "@/components/acts/ActShell";
import { Doodles } from "@/components/acts/Doodles";
import { PeekCat } from "@/components/acts/PeekCat";

import { RansomText, hash } from "@/components/acts/RansomText";
import { cn } from "@/components/ui";

const t = copy.act5;
const MAX_PER_ROUND = 12; // чтобы викторина не растянулась, берём до 12 вопросов в раунде

type Q = { id: string; round: 1 | 2; text: string; answer: string; options: string[] };
type Stage = { kind: "intro"; round: 1 | 2 } | { kind: "question"; i: number } | { kind: "score" };

const PAPERS = ["note-kraft", "note-grid", "note-clip", "note-crumpled"];
const PAPER_PAD: Record<string, string> = {
  "note-clip": "17% 16% 15% 13%",
  "note-kraft": "15% 11% 15% 17%",
  "note-grid": "19% 13% 13% 15%",
  "note-crumpled": "17% 11% 11% 13%",
};

function buildQuestions(data: {
  names: string[];
  round1: { id: string; text: string; answer: string }[];
  round2: { id: string; text: string; answer: string; wrong: string[] }[];
}): Q[] {
  const r1 = shuffle(data.round1)
    .filter((q) => q.answer)
    .slice(0, MAX_PER_ROUND)
    .map<Q>((q) => {
      const others = shuffle(data.names.filter((n) => n.toLowerCase() !== q.answer.toLowerCase())).slice(0, 3);
      return { id: q.id, round: 1, text: q.text, answer: q.answer, options: shuffle([q.answer, ...others]) };
    })
    .filter((q) => q.options.length >= 2);
  const r2 = shuffle(data.round2)
    .slice(0, MAX_PER_ROUND)
    .map<Q>((q) => ({ id: q.id, round: 2, text: q.text, answer: q.answer, options: shuffle([q.answer, ...q.wrong]) }));
  return [...r1, ...r2];
}

export default function Act5() {
  const [qs, setQs] = useState<Q[] | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "intro", round: 1 });
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetch("/api/public/quiz").then((r) => (r.ok ? r.json() : null));
        const list = data ? buildQuestions(data) : [];
        setQs(list);
        if (!list.length) setStage({ kind: "score" });
        else setStage({ kind: "intro", round: list[0].round });
      } catch {
        setQs([]);
        setStage({ kind: "score" });
      }
    })();
  }, []);

  // заставка раунда держится 2 секунды
  useEffect(() => {
    if (stage.kind !== "intro" || !qs) return;
    const first = qs.findIndex((q) => q.round === stage.round);
    const id = setTimeout(() => setStage({ kind: "question", i: first }), 2000);
    return () => clearTimeout(id);
  }, [stage, qs]);

  const q = stage.kind === "question" && qs ? qs[stage.i] : null;

  const choose = (opt: string) => {
    if (!q || picked) return;
    setPicked(opt);
    if (opt === q.answer) {
      setScore((s) => s + 1);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ["#f9c5d5", "#e88aa8", "#fff3e3", "#f6cf7a"], disableForReducedMotion: true });
    }
  };

  const next = () => {
    if (!qs || stage.kind !== "question") return;
    setPicked(null);
    const n = stage.i + 1;
    if (n >= qs.length) setStage({ kind: "score" });
    else if (qs[n].round !== qs[stage.i].round) setStage({ kind: "intro", round: qs[n].round });
    else setStage({ kind: "question", i: n });
  };

  const roundQs = useMemo(() => (q && qs ? qs.filter((x) => x.round === q.round) : []), [q, qs]);
  const posInRound = q ? roundQs.findIndex((x) => x.id === q.id) : 0;
  const paperId = q ? PAPERS[Math.floor(hash(q.id) * PAPERS.length)] : PAPERS[0];
  const seal = ASSETS["seal-pink"] ? assetUrl("seal-pink") : null;

  return (
    <ActShell back="/act4" className="scrap-desk">
      <Doodles seed="act5" count={12} kinds={["question", "star", "crown", "sparkle", "bolt", "smile"]} />
      {/* котики реагируют на ответ */}
      {q && picked && picked === q.answer && <PeekCat key={`yes${q.id}`} cat="cat-wink" edge="bottom-right" size={125} delay={0.2} />}
      {q && picked && picked !== q.answer && <PeekCat key={`no${q.id}`} cat="cat-shock" edge="bottom-left" size={125} delay={0.2} />}
      {stage.kind === "score" && <PeekCat cat="cat-calico" edge="bottom-right" size={130} delay={0.8} />}
      {stage.kind === "score" && <PeekCat cat="cat-kitten-cupcake" edge="left" top="18%" size={100} delay={1.4} />}
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 pb-12 pt-20">
        {qs === null && <div className="size-10 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />}

        <AnimatePresence mode="wait">
          {/* заставка раунда */}
          {stage.kind === "intro" && qs && qs.length > 0 && (
            <motion.div
              key={`intro${stage.round}`}
              className="text-center"
              initial={{ scale: 1.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              exit={{ scale: 0.7, opacity: 0, rotate: 6 }}
              transition={{ type: "spring", damping: 11 }}
            >
              <RansomText text={stage.round === 1 ? t.round1 : t.round2} size={38} />
            </motion.div>
          )}

          {/* вопрос */}
          {q && (
            <motion.div
              key={q.id}
              className="flex w-full flex-col items-center gap-6"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* прогресс раунда */}
              <div className="flex gap-1.5">
                {roundQs.map((x, i) => (
                  <span key={x.id} className={cn("size-2 rounded-full", i < posInRound ? "bg-pink-deep" : i === posInRound ? "bg-pink-deep/60" : "bg-pink")} />
                ))}
              </div>

              {/* бумажка с вопросом */}
              <div
                className="flex w-[92%] rotate-[-1.5deg] items-center justify-center drop-shadow-[0_8px_10px_rgba(90,30,50,.22)]"
                style={{
                  backgroundImage: `url(${assetUrl(paperId)})`,
                  backgroundSize: "100% 100%",
                  aspectRatio: ASSETS[paperId] ? `${ASSETS[paperId].w} / ${ASSETS[paperId].h * 0.82}` : "4 / 3",
                  padding: PAPER_PAD[paperId],
                }}
              >
                <p className="text-center font-hand text-[1.6rem] font-bold leading-[1.15] text-[#4a2a36]">{q.text}</p>
              </div>

              {/* варианты-полароиды */}
              <div className="grid w-full grid-cols-2 gap-4">
                {q.options.map((opt, i) => {
                  const isAnswer = opt === q.answer;
                  const isPicked = opt === picked;
                  const tilt = (hash(q.id + opt) - 0.5) * 8;
                  return (
                    <motion.button
                      key={opt + i}
                      onClick={() => choose(opt)}
                      disabled={!!picked}
                      className={cn(
                        "relative flex min-h-24 items-center justify-center bg-white px-3 pb-6 pt-3 shadow-[0_6px_12px_-4px_rgba(90,30,50,.3)]",
                        picked && !isAnswer && !isPicked && "opacity-50",
                      )}
                      style={{ rotate: `${tilt}deg` }}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: picked && !isAnswer && !isPicked ? 0.5 : 1 }}
                      transition={{ delay: 0.15 + i * 0.07 }}
                      whileTap={picked ? undefined : { scale: 0.95 }}
                    >
                      <span className="flex min-h-14 w-full items-center justify-center bg-[#fdf1f5] px-2 py-2 text-center font-hand text-[1.4rem] font-bold leading-tight text-rose-ink">
                        {opt}
                      </span>
                      {/* печать на верном ответе */}
                      {picked && isAnswer && seal && (
                        <motion.img
                          src={seal}
                          alt=""
                          className="pointer-events-none absolute -right-3 -top-4 w-14"
                          initial={{ scale: 2.6, opacity: 0, rotate: -30 }}
                          animate={{ scale: 1, opacity: 1, rotate: 12 }}
                          transition={{ type: "spring", damping: 9, stiffness: 260 }}
                        />
                      )}
                      {/* маркер на неверном выборе */}
                      {isPicked && !isAnswer && (
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute left-2 top-2 h-[calc(100%-16px)] w-[calc(100%-16px)]">
                          <motion.path
                            d="M10 12 L90 88 M88 14 L12 86"
                            fill="none"
                            stroke="#e94b6b"
                            strokeWidth={7}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.45 }}
                          />
                        </svg>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* реакция + кнопка дальше */}
              <div className="flex min-h-24 flex-col items-center gap-3">
                <AnimatePresence>
                  {picked && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <p className={cn("text-center font-hand text-[2rem] font-bold leading-none", picked === q.answer ? "text-pink-deep" : "text-[#c2405d]")}>
                        {picked === q.answer ? t.correct : q.round === 1 ? `${t.wrongWho} ${q.answer}` : t.wrong}
                      </p>
                      <button
                        onClick={next}
                        aria-label="next"
                        className="grid size-14 place-items-center rounded-full bg-pink-deep text-white shadow-[0_5px_0_#c9688a] active:translate-y-0.5"
                      >
                        <ArrowRight className="size-6" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* итог */}
          {stage.kind === "score" && qs && (
            <motion.div
              key="score"
              className="flex flex-col items-center gap-8 text-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
            >
              {qs.length > 0 && (
                <>
                  <RansomText text={t.score} size={34} />
                  <RansomText text={`${score} / ${qs.length}`} size={64} />
                </>
              )}
              <Link
                href="/act6"
                className="inline-block rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]"
              >
                {t.next}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ActShell>
  );
}
