"use client";

// Акт 4: розовый дисковый телефон. Друзья «звонят» по очереди: телефон дребезжит,
// рядом записка «входящий» с именем. Тап по трубке — ответить, ещё тап — положить.
// Кнопку «отклонить» нажать невозможно — она убегает от пальца.
// После всех звонков — конф-колл: кружки друзей загораются по очереди, пока звучат их фразы.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneOff } from "lucide-react";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { loadClips, shuffle, type MixClip, type RawClip } from "@/lib/mix";
import { playBuffer, playClick, playRing, unlockAudio } from "@/lib/sound";
import { ActShell } from "@/components/acts/ActShell";
import { Doodles } from "@/components/acts/Doodles";
import { PeekCat } from "@/components/acts/PeekCat";

import { RotaryPhone } from "@/components/acts/RotaryPhone";
import { hash } from "@/components/acts/RansomText";
import { cn } from "@/components/ui";

const t = copy.act4;
type Phase = "loading" | "ringing" | "talking" | "between" | "conference" | "done";

const BUBBLE_COLORS = ["#f9c5d5", "#fff0dc", "#cfe0f5", "#d8efdf", "#f6cf7a", "#e8d5f5"];

async function fetchClips(type: "call" | "final"): Promise<MixClip[]> {
  let raw: RawClip[] = [];
  try {
    raw = await fetch(`/api/public/audios?type=${type}`).then((r) => (r.ok ? r.json() : []));
  } catch {
    raw = [];
  }
  return loadClips(shuffle(raw));
}

export default function Act4() {
  const [calls, setCalls] = useState<MixClip[]>([]);
  const [finals, setFinals] = useState<MixClip[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [idx, setIdx] = useState(0);
  const [speaking, setSpeaking] = useState(-1); // кто говорит в конф-колле
  const stopRef = useRef<(() => void) | null>(null);
  const idxRef = useRef(0);

  // загрузка звонков и фраз для конф-колла
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, f] = await Promise.all([fetchClips("call"), fetchClips("final")]);
      if (cancelled) return;
      setCalls(c);
      setFinals(f);
      setPhase(c.length ? "ringing" : f.length ? "conference" : "done");
    })();
    return () => {
      cancelled = true;
      stopRef.current?.();
    };
  }, []);

  // телефон звонит, пока не ответят
  useEffect(() => {
    if (phase !== "ringing") return;
    playRing();
    const id = setInterval(playRing, 2400);
    return () => clearInterval(id);
  }, [phase, idx]);

  const nextCall = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    playClick();
    const n = idxRef.current + 1;
    setPhase("between");
    if (n < calls.length) {
      idxRef.current = n;
      setIdx(n);
      setTimeout(() => setPhase("ringing"), 1300);
    } else {
      setTimeout(() => setPhase(finals.length ? "conference" : "done"), 1300);
    }
  }, [calls.length, finals.length]);

  const onHandset = () => {
    unlockAudio();
    if (phase === "ringing") {
      playClick();
      setPhase("talking");
      stopRef.current = playBuffer(calls[idx].buffer, nextCall);
    } else if (phase === "talking") {
      nextCall();
    }
  };

  // конф-колл: фразы звучат одна за другой, кружок говорящего «загорается»
  useEffect(() => {
    if (phase !== "conference") return;
    let i = 0;
    let cancelled = false;
    const playNext = () => {
      if (cancelled) return;
      if (i >= finals.length) {
        setSpeaking(-1);
        setTimeout(() => !cancelled && setPhase("done"), 600);
        return;
      }
      setSpeaking(i);
      const cur = i++;
      stopRef.current = playBuffer(finals[cur].buffer, () => setTimeout(playNext, 350));
    };
    // даём кружкам появиться
    const start = setTimeout(playNext, 900 + finals.length * 120);
    return () => {
      cancelled = true;
      clearTimeout(start);
      stopRef.current?.();
    };
  }, [phase, finals]);

  const call = calls[idx];
  const showCaller = (phase === "ringing" || phase === "talking") && call;
  const inConference = phase === "conference" || (phase === "done" && finals.length > 0);

  return (
    <ActShell back="/act3" className="scrap-desk">
      <Doodles seed="act4" count={11} kinds={["ring", "heart", "bolt", "star", "squiggle", "sparkle"]} />
      {/* котик пугается звонка */}
      {phase === "ringing" && <PeekCat key={`shock${idx}`} cat="cat-shock" edge="right" top="34%" size={110} delay={0.4} />}
      {phase === "talking" && <PeekCat key={`listen${idx}`} cat="cat-wink" edge="left" top="30%" size={105} delay={0.6} />}
      {inConference && <PeekCat cat="cat-orange" edge="bottom-left" size={120} delay={0.8} />}
      {inConference && <PeekCat cat="cat-tongue" edge="bottom-right" size={120} delay={1.3} />}
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 pb-16 pt-20">
        {phase === "loading" && <div className="size-10 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />}

        {/* ---------- звонки ---------- */}
        {!inConference && phase !== "loading" && phase !== "done" && (
          <>
            {/* точки: сколько звонков уже было */}
            {calls.length > 1 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {calls.map((_, i) => (
                  <span key={i} className={cn("size-2 rounded-full", i < idx ? "bg-pink-deep" : i === idx ? "bg-pink-deep/60" : "bg-pink")} />
                ))}
              </div>
            )}

            {/* записка «входящий» */}
            <div className="h-28">
              <AnimatePresence mode="wait">
                {showCaller && (
                  <motion.div
                    key={call.id}
                    className="rotate-[-3deg] bg-[#fff3a8] px-6 pb-4 pt-3 text-center shadow-[0_8px_14px_-6px_rgba(90,60,20,.4)]"
                    style={{ clipPath: "polygon(0 3%, 100% 0, 98% 100%, 2% 97%)" }}
                    initial={{ y: -30, opacity: 0, rotate: -12 }}
                    animate={{ y: 0, opacity: 1, rotate: -3 }}
                    exit={{ y: 20, opacity: 0, rotate: 6 }}
                    transition={{ type: "spring", damping: 13 }}
                  >
                    <p className="font-hand text-xl font-bold leading-none text-[#8a6d3b]">{t.incoming}</p>
                    <p className="mt-1 font-hand text-[2.6rem] font-bold leading-none text-rose-ink">{call.name}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative w-[88%]">
              <RotaryPhone state={phase === "talking" ? "talking" : phase === "ringing" ? "ringing" : "idle"} onHandset={onHandset} />

              {/* звуковые волны во время разговора */}
              {phase === "talking" && (
                <div className="pointer-events-none absolute left-[18%] top-[6%]">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="absolute size-10 rounded-full border-2 border-pink-deep"
                      initial={{ scale: 0.4, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* «отклонить» — убегает */}
            <div className="relative h-24 w-full">{phase === "ringing" && <RunawayButton seed={call?.id ?? ""} />}</div>
          </>
        )}

        {/* ---------- конф-колл ---------- */}
        {inConference && (
          <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-5">
            {finals.map((f, i) => {
              const color = BUBBLE_COLORS[Math.floor(hash(f.id) * BUBBLE_COLORS.length)];
              const on = i === speaking;
              return (
                <motion.div
                  key={f.id}
                  className="flex w-20 flex-col items-center gap-1"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: on ? 1.15 : 1, opacity: 1 }}
                  transition={{ delay: phase === "conference" && speaking < 0 ? i * 0.12 : 0, type: "spring", damping: 12 }}
                >
                  <div className="relative">
                    {on && (
                      <motion.span
                        className="absolute inset-0 rounded-full border-4 border-pink-deep"
                        animate={{ scale: [1, 1.35], opacity: [0.9, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    <div
                      className={cn(
                        "grid size-16 place-items-center rounded-full font-display text-2xl font-bold text-rose-ink ring-4 transition-shadow",
                        on ? "ring-pink-deep shadow-[0_0_24px_#e88aa8]" : "ring-white",
                      )}
                      style={{ background: color }}
                    >
                      {f.name.trim().charAt(0).toUpperCase() || "·"}
                    </div>
                  </div>
                  <span className={cn("max-w-full truncate font-hand text-xl font-bold leading-none", on ? "text-pink-deep" : "text-rose-ink/75")}>
                    {f.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Link
              href="/act5"
              className="inline-block rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]"
            >
              {t.next}
            </Link>
          </motion.div>
        )}
      </div>
    </ActShell>
  );
}

// Кнопка «отклонить», которую невозможно нажать: при приближении пальца отпрыгивает
function RunawayButton({ seed }: { seed: string }) {
  const [pos, setPos] = useState({ x: 0.72, y: 0.4 });
  const jumps = useRef(0);
  const flee = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    jumps.current++;
    const r = (k: number) => hash(`${seed}${jumps.current}${k}`);
    // прыгаем в случайную точку подальше от текущей
    setPos((p) => {
      let x = 0.1 + r(1) * 0.8;
      if (Math.abs(x - p.x) < 0.3) x = p.x > 0.5 ? x * 0.4 : 0.6 + x * 0.4;
      return { x, y: r(2) };
    });
  };
  return (
    <motion.button
      aria-label="decline"
      onPointerDown={flee}
      onPointerEnter={flee}
      onClick={(e) => e.preventDefault()}
      className="absolute grid size-14 place-items-center rounded-full bg-[#ff6b81] text-white shadow-[0_5px_0_#d94d63]"
      animate={{ left: `${pos.x * 100}%`, top: `${pos.y * 70}%`, rotate: (jumps.current % 2 ? 1 : -1) * 15 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      style={{ x: "-50%" }}
      initial={false}
    >
      <PhoneOff className="size-6" />
    </motion.button>
  );
}
