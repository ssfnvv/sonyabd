"use client";

// Видео до 15 секунд для финального трейлера: запись с камеры прямо на сайте
// (битрейт снижен, файл ~3–4 МБ) или выбор готового ролика из галереи.
import { useEffect, useRef, useState } from "react";
import { SwitchCamera, Video } from "lucide-react";
import { copy } from "@/content/copy";
import { extFromMime, submit, uploadFile, type Friend } from "@/lib/client-api";
import { useRecorder } from "@/lib/useRecorder";
import { Button, Note, Screen, fmtTime } from "../ui";

const t = copy.contribute;
const MAX_SEC = 15;
const MAX_BYTES = 50 * 1024 * 1024; // лимит Supabase на файл в бесплатном тарифе

// Длительность выбранного из галереи видео
function probeDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve(v.duration);
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => resolve(Infinity);
    v.src = URL.createObjectURL(file);
  });
}

export function VideoRecorder({ friend, onBack, onDone }: { friend: Friend; onBack: () => void; onDone: () => void }) {
  const rec = useRecorder("video", MAX_SEC);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  // Живое превью камеры
  useEffect(() => {
    if (liveRef.current) liveRef.current.srcObject = rec.stream;
  }, [rec.stream]);

  useEffect(() => {
    if (!rec.blob) {
      setPlaybackUrl(null);
      return;
    }
    const url = URL.createObjectURL(rec.blob);
    setPlaybackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rec.blob]);

  const flip = async () => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    await rec.open(next);
  };

  // Видео из галереи: проверяем длину и размер
  const onPick = async (files: FileList | null) => {
    const file = files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    const dur = await probeDuration(file);
    if (dur > MAX_SEC + 1) return setError(t.videoTooLong);
    if (file.size > MAX_BYTES) return setError(t.videoTooLong);
    rec.stopTracks();
    rec.setBlob(file);
    rec.setSeconds(Number.isFinite(dur) ? dur : 0);
    rec.setState("done");
  };

  const send = async () => {
    if (!rec.blob) return;
    setSending(true);
    setError(null);
    try {
      const mime = rec.blob.type || "video/mp4";
      const path = await uploadFile(friend.id, "video", rec.blob, extFromMime(mime, "mp4"));
      await submit("video", { friendId: friend.id, path, mime, duration: rec.seconds });
      rec.stopTracks();
      onDone();
    } catch {
      setError(t.uploadError);
    } finally {
      setSending(false);
    }
  };

  const showLive = rec.state === "preview" || rec.state === "recording";

  return (
    <Screen
      title={t.sections.video}
      onBack={() => {
        rec.stopTracks();
        onBack();
      }}
      backLabel={t.back}
    >
      <p className="font-semibold leading-snug">{t.videoHint}</p>

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-pink-soft ring-2 ring-pink">
        {showLive && (
          <video
            ref={liveRef}
            autoPlay
            muted
            playsInline
            className="size-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
          />
        )}
        {rec.state === "done" && playbackUrl && (
          <video src={playbackUrl} controls playsInline className="size-full bg-black object-contain" />
        )}
        {rec.state === "idle" && (
          <div className="grid size-full place-items-center">
            <Video className="size-14 text-pink-deep" />
          </div>
        )}

        {showLive && (
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-sm font-bold tabular-nums">
            {rec.state === "recording" && <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-red-500" />}
            {fmtTime(rec.seconds)} / {fmtTime(MAX_SEC)}
          </span>
        )}
        {rec.state === "preview" && (
          <button
            onClick={flip}
            aria-label="camera"
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/85 active:scale-90"
          >
            <SwitchCamera className="size-5" />
          </button>
        )}
      </div>

      {/* служебная строка: видна только если запись оборвалась слишком рано */}
      {rec.state === "done" && rec.seconds < 2 && rec.debug && (
        <p className="break-all text-[10px] leading-tight text-rose-ink/50">{rec.debug}</p>
      )}
      {rec.error === "denied" && <Note tone="error">{t.cameraDenied}</Note>}
      {rec.error === "unsupported" && <Note tone="error">{t.unsupported}</Note>}
      {error && <Note tone="error">{error}</Note>}

      {rec.state === "idle" && (
        <Button onClick={() => rec.open(facing)}>{t.voiceButtons.record}</Button>
      )}
      {rec.state === "preview" && <Button onClick={rec.start}>{t.voiceButtons.record}</Button>}
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

      {(rec.state === "idle" || rec.state === "preview") && (
        <>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            {t.videoFromGallery}
          </Button>
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => onPick(e.target.files)} />
        </>
      )}
    </Screen>
  );
}
