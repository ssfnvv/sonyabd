"use client";

// Запись голосового: выбор типа (радио / звонок / конф-колл), запись с живыми полосками звука,
// прослушивание, перезапись и отправка.
import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Phone, Play, Radio, Users } from "lucide-react";
import { copy } from "@/content/copy";
import { extFromMime, submit, uploadFile, type Friend } from "@/lib/client-api";
import { useRecorder } from "@/lib/useRecorder";
import { Button, Note, Screen, cn, fmtTime } from "../ui";

const t = copy.contribute;

type AudioType = "diary" | "call" | "final";
// Лимиты длины: история и звонок — до минуты с запасом, фраза для конф-колла — короткая
const LIMITS: Record<AudioType, number> = { diary: 75, call: 75, final: 20 };
const ICONS = { diary: Radio, call: Phone, final: Users };

export function VoiceRecorder({ friend, onBack, onDone }: { friend: Friend; onBack: () => void; onDone: () => void }) {
  const [type, setType] = useState<AudioType | null>(null);

  if (!type) {
    return (
      <Screen title={t.sections.voice} onBack={onBack} backLabel={t.back}>
        {(Object.keys(LIMITS) as AudioType[]).map((k) => {
          const Icon = ICONS[k];
          return (
            <button
              key={k}
              onClick={() => setType(k)}
              className="flex items-center gap-4 rounded-3xl bg-white/85 p-5 text-left ring-2 ring-pink active:scale-[.98]"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-pink-soft">
                <Icon className="size-6" />
              </span>
              <span className="font-semibold leading-snug">{t.voiceTypes[k]}</span>
            </button>
          );
        })}
      </Screen>
    );
  }

  return <VoiceRecordStep key={type} type={type} friend={friend} onBack={() => setType(null)} onDone={onDone} />;
}

function VoiceRecordStep({
  type,
  friend,
  onBack,
  onDone,
}: {
  type: AudioType;
  friend: Friend;
  onBack: () => void;
  onDone: () => void;
}) {
  const rec = useRecorder("audio", LIMITS[type]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rec.blob) return setAudioUrl(null);
    const url = URL.createObjectURL(rec.blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rec.blob]);

  const send = async () => {
    if (!rec.blob) return;
    setSending(true);
    setSendError(false);
    try {
      const mime = rec.blob.type || "audio/webm";
      const path = await uploadFile(friend.id, "audio", rec.blob, extFromMime(mime, "webm"));
      await submit("audio", { friendId: friend.id, type, path, mime, duration: rec.seconds });
      onDone();
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  return (
    <Screen title={t.voiceTypes[type]} onBack={onBack} backLabel={t.back}>
      <div className="flex flex-col items-center gap-6 rounded-[2rem] bg-white/85 px-5 py-8 ring-2 ring-pink">
        <LevelBars stream={rec.state === "recording" ? rec.stream : null} />

        <p className="font-display text-4xl font-bold tabular-nums">
          {fmtTime(rec.seconds)}
          <span className="text-lg text-rose-ink/40"> / {fmtTime(LIMITS[type])}</span>
        </p>

        {rec.state === "done" && audioUrl && (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              playsInline
            />
            <button
              onClick={togglePlay}
              aria-label={playing ? "pause" : "play"}
              className="grid size-16 place-items-center rounded-full bg-pink-soft ring-2 ring-pink active:scale-90"
            >
              {playing ? <Pause className="size-7" /> : <Play className="size-7 translate-x-0.5" />}
            </button>
          </>
        )}
      </div>

      {rec.error === "denied" && <Note tone="error">{t.micDenied}</Note>}
      {rec.error === "unsupported" && <Note tone="error">{t.unsupported}</Note>}
      {sendError && <Note tone="error">{t.uploadError}</Note>}

      {rec.state !== "recording" && rec.state !== "done" && (
        <Button onClick={rec.start}>
          <Mic className="size-5" />
          {t.voiceButtons.record}
        </Button>
      )}
      {rec.state === "recording" && <Button onClick={rec.stop}>{t.voiceButtons.stop}</Button>}
      {rec.state === "done" && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="soft" onClick={rec.reset} disabled={sending}>
            {t.voiceButtons.again}
          </Button>
          <Button onClick={send} loading={sending}>
            {t.voiceButtons.send}
          </Button>
        </div>
      )}
    </Screen>
  );
}

// Живые полоски громкости во время записи
function LevelBars({ stream }: { stream: MediaStream | null }) {
  const [levels, setLevels] = useState<number[]>(() => Array(24).fill(0.08));

  useEffect(() => {
    if (!stream) {
      setLevels(Array(24).fill(0.08));
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevels(Array.from({ length: 24 }, (_, i) => Math.max(0.08, data[i + 2] / 255)));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      ctx.close();
    };
  }, [stream]);

  return (
    <div className="flex h-20 items-center gap-1">
      {levels.map((l, i) => (
        <span
          key={i}
          className={cn("w-1.5 rounded-full bg-pink-deep transition-[height] duration-75", !stream && "bg-pink")}
          style={{ height: `${l * 100}%` }}
        />
      ))}
    </div>
  );
}
