"use client";

// Страница-архив для друзей: всё, что собрали для Сони, на одной странице — без таймера и игр.
// Открывается только после полуночи 8 октября (до этого — перекидывает на главную, чтобы
// ничего не всплыло раньше времени). Для проверки заранее: /archive?preview
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { mediaUrl } from "@/lib/media";
import { REAL_TARGET } from "@/lib/birthday";
import { SPECIAL_VIDEOS } from "@/content/special";
import { ActShell } from "@/components/acts/ActShell";
import { Doodles } from "@/components/acts/Doodles";
import { Marker } from "@/components/acts/Marker";
import { Poster, type Card } from "@/components/acts/Poster";
import { hash } from "@/components/acts/RansomText";
import { cn } from "@/components/ui";

type Audio = { id: string; path: string; name: string };
type Video = { id: string; path?: string; src?: string; name: string };
type Pred = { id: string; text: string; name: string };
type QuizData = {
  round1: { id: string; text: string; answer: string }[];
  round2: { id: string; text: string; answer: string }[];
};

const VOICE_TYPES = ["diary", "call"] as const;

const getJson = <T,>(url: string, fallback: T): Promise<T> =>
  fetch(url)
    .then((r) => (r.ok ? r.json() : fallback))
    .catch(() => fallback);

export default function Archive() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [audios, setAudios] = useState<Record<string, Audio[]>>({});
  const [quiz, setQuiz] = useState<QuizData>({ round1: [], round2: [] });
  const [videos, setVideos] = useState<Video[]>([]);
  const [preds, setPreds] = useState<Pred[]>([]);
  const [loading, setLoading] = useState(true);

  // до дня рождения архив закрыт
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).has("preview");
    if (Date.now() < REAL_TARGET && !preview) router.replace("/");
    else setOpen(true);
  }, [router]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const audio = (tp: string) => getJson<Audio[]>(`/api/public/audios?type=${tp}`, []);
      const [c, d, cl, q, fin] = await Promise.all([
        getJson<Card[]>("/api/public/timeline", []),
        audio("diary"),
        audio("call"),
        getJson<QuizData>("/api/public/quiz", { round1: [], round2: [] }),
        getJson<{ videos: Video[]; predictions: Pred[] }>("/api/public/final", { videos: [], predictions: [] }),
      ]);
      setCards(c);
      setAudios({ diary: d, call: cl });
      setQuiz(q);
      setVideos([...fin.videos, ...SPECIAL_VIDEOS]);
      setPreds(fin.predictions);
      setLoading(false);
    })();
  }, [open]);

  if (!open) return <main className="min-h-dvh bg-cream" />;

  return (
    <ActShell className="scrap-desk" quiet>
      <Doodles seed="archive" count={12} kinds={["heart", "star", "sparkle", "flower", "smile", "note"]} />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-14 px-3 pb-24 pt-16">
        {loading && <div className="mt-40 size-10 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />}

        {!loading && (
          <>
            {cards.length > 0 && <Poster cards={cards} />}

            {/* голосовые трёх видов */}
            <AudioPlayerGroup audios={audios} />

            {/* викторина: факты с авторами и вопросы с верными ответами */}
            {quiz.round1.length > 0 && (
              <Section title={copy.act5.round1}>
                <div className="grid w-full gap-4">
                  {quiz.round1.map((q) => (
                    <Note key={q.id} id={q.id} text={q.text} name={q.answer} />
                  ))}
                </div>
              </Section>
            )}
            {quiz.round2.length > 0 && (
              <Section title={copy.act5.round2}>
                <div className="grid w-full gap-4">
                  {quiz.round2.map((q) => (
                    <Note key={q.id} id={q.id} text={q.text} answer={q.answer} />
                  ))}
                </div>
              </Section>
            )}

            {preds.length > 0 && (
              <Section title={copy.contribute.sections.prediction}>
                <div className="grid w-full grid-cols-2 gap-3">
                  {preds.map((p) => (
                    <Note key={p.id} id={p.id} text={p.text} name={p.name} small />
                  ))}
                </div>
              </Section>
            )}

            {videos.length > 0 && (
              <Section title={copy.contribute.sections.video}>
                <div className="grid w-full grid-cols-2 gap-3">
                  {videos.map((v) => (
                    <div key={v.id} className="relative overflow-hidden rounded-md bg-black shadow-[0_8px_16px_-8px_rgba(90,30,50,.5)]">
                      <video
                        src={v.src ?? mediaUrl(v.path ?? "")}
                        controls
                        playsInline
                        preload="metadata"
                        className="aspect-[9/16] w-full bg-black object-contain"
                      />
                      <p className="font-hand pointer-events-none absolute left-2 top-1 text-2xl font-bold leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,.8)]">
                        {v.name}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </ActShell>
  );
}

// заголовок раздела рукописным шрифтом с маркерной волной
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex w-full flex-col items-center gap-5">
      <div className="relative">
        <h2 className="font-hand text-[2.4rem] font-bold leading-none text-rose-ink">{title.toLowerCase()}</h2>
        <Marker kind="wave" className="left-1/2 -translate-x-1/2" style={{ top: "calc(100% - 24px)" }} size={70} />
      </div>
      {children}
    </section>
  );
}

// записка: текст + подпись-имя (или верный ответ)
function Note({ id, text, name, answer, small }: { id: string; text: string; name?: string; answer?: string; small?: boolean }) {
  const tilt = (hash(id) - 0.5) * 4;
  return (
    <motion.div
      className="bg-[#fffdf6] px-5 py-4 shadow-[0_8px_14px_-8px_rgba(90,30,50,.4)]"
      style={{ rotate: `${tilt}deg` }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <p className={cn("font-hand whitespace-pre-wrap font-bold leading-[1.15] text-[#4a2a36]", small ? "text-[1.3rem]" : "text-[1.55rem]")}>{text}</p>
      {answer && <p className="font-hand mt-2 text-[1.5rem] font-bold leading-none text-pink-deep">✓ {answer}</p>}
      {name && <p className="font-hand mt-2 text-right text-[1.5rem] font-bold leading-none text-pink-deep">{name}</p>}
    </motion.div>
  );
}

// все голосовые: по разделам, один общий плеер
function AudioPlayerGroup({ audios }: { audios: Record<string, Audio[]> }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [cur, setCur] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = (a: Audio) => {
    const el = ref.current;
    if (!el) return;
    if (cur === a.id) {
      if (el.paused) el.play().catch(() => {});
      else el.pause();
      return;
    }
    el.src = mediaUrl(a.path);
    setCur(a.id);
    setProgress(0);
    el.play().catch(() => {});
  };

  return (
    <>
      <audio
        ref={ref}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
      />
      {VOICE_TYPES.map((tp) =>
        audios[tp]?.length ? (
          <Section key={tp} title={copy.contribute.voiceTypes[tp]}>
            <ol className="notebook-page w-[94%] py-5 pl-12 pr-4 drop-shadow-[0_8px_10px_rgba(90,30,50,.2)]">
              {audios[tp].map((a) => {
                const on = cur === a.id;
                return (
                  <li key={a.id}>
                    <button onClick={() => toggle(a)} className="flex h-[2.6rem] w-full items-center gap-3 text-left">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-white", on ? "bg-pink-deep" : "bg-[#e8a3bb]")}>
                        {on && playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className={cn("font-hand block truncate text-[1.55rem] font-bold leading-none", on ? "text-pink-deep" : "text-[#4a2a36]/80")}>{a.name}</span>
                        {on && <span className="absolute -bottom-1.5 left-0 h-[3px] rounded-full bg-pink-deep" style={{ width: `${progress * 100}%` }} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Section>
        ) : null,
      )}
    </>
  );
}
