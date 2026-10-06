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

import { PhotoPhone } from "@/components/acts/PhotoPhone";
import { Conference } from "@/components/acts/Conference";
import { assetUrl, ASSETS } from "@/content/assets";
import { hash } from "@/components/acts/RansomText";
import { cn } from "@/components/ui";

const t = copy.act4;
type Phase = "loading" | "ringing" | "talking" | "between" | "conference" | "done";


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
    <ActShell back="/act3" className="scrap-desk" quiet>
      <Doodles seed="act4" count={11} kinds={["ring", "heart", "bolt", "star", "squiggle", "sparkle"]} />
      {/* котик пугается звонка */}
      {/* на звонок по очереди реагируют: орущий парень и испуганный котик */}
      {phase === "ringing" && (
        <PeekCat key={`shock${idx}`} cat={idx % 2 ? "cat-shock" : "meme-scream"} edge="right" top="34%" size={idx % 2 ? 110 : 120} delay={0.4} />
      )}
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
                    className="relative flex w-72 flex-col items-center justify-center px-8 pb-6 pt-3 text-center drop-shadow-[0_8px_10px_rgba(150,60,90,.25)]"
                    style={{ backgroundImage: `url(${assetUrl("felt-bubble")})`, backgroundSize: "100% 100%", aspectRatio: "1000 / 409" }}
                    initial={{ y: -30, opacity: 0, rotate: -12, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, rotate: -3, scale: 1 }}
                    exit={{ y: 20, opacity: 0, rotate: 6 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <p className="font-hand text-xl font-bold leading-none text-[#b2557a]">{t.incoming}</p>
                    <p className="mt-1 max-w-full truncate font-hand text-[2.4rem] font-bold leading-none text-rose-ink">{call.name}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative w-[86%]">
              <PhotoPhone state={phase === "talking" ? "talking" : phase === "ringing" ? "ringing" : "idle"} onTap={onHandset} />
            </div>

            {/* «отклонить» — убегает */}
            <div className="relative h-24 w-full">{phase === "ringing" && <RunawayButton seed={call?.id ?? ""} />}</div>
          </>
        )}

        {/* ---------- конф-колл ---------- */}
        {inConference && <Conference people={finals} speaking={speaking} />}

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
  const [smirk, setSmirk] = useState(0); // счётчик побегов — на каждый ухмыляется Роблокс
  const jumps = useRef(0);
  const flee = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    jumps.current++;
    setSmirk(jumps.current);
    const r = (k: number) => hash(`${seed}${jumps.current}${k}`);
    // прыгаем в случайную точку подальше от текущей
    setPos((p) => {
      let x = 0.1 + r(1) * 0.8;
      if (Math.abs(x - p.x) < 0.3) x = p.x > 0.5 ? x * 0.4 : 0.6 + x * 0.4;
      return { x, y: r(2) };
    });
  };
  return (
    <>
    {/* ухмылка Роблокс: «не выйдет» — появляется с той стороны, куда кнопка не убежала */}
    <AnimatePresence>
      {smirk > 0 && ASSETS["meme-roblox"] && (
        <motion.img
          key={smirk}
          src={assetUrl("meme-roblox")}
          alt=""
          className="pointer-events-none absolute top-1 w-24"
          style={{ left: pos.x > 0.5 ? "6%" : "auto", right: pos.x > 0.5 ? "auto" : "6%" }}
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", damping: 10, opacity: { duration: 1.6, times: [0, 0.1, 0.75, 1] } }}
        />
      )}
    </AnimatePresence>
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
    </>
  );
}
