"use client";

// Общий хук записи для голосовых и видео на MediaRecorder.
// Сам выбирает формат, который понимает браузер: iPhone пишет mp4, Android/Chrome — webm.
import { useCallback, useEffect, useRef, useState } from "react";

const AUDIO_TYPES = ["audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/mp4", "audio/webm"];
const VIDEO_TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function pickMime(kind: "audio" | "video"): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return (kind === "audio" ? AUDIO_TYPES : VIDEO_TYPES).find((t) => MediaRecorder.isTypeSupported(t));
}

export type RecState = "idle" | "preview" | "recording" | "done";
export type RecError = "denied" | "unsupported" | null;

export function useRecorder(kind: "audio" | "video", maxSec: number) {
  const [state, setState] = useState<RecState>("idle");
  const [error, setError] = useState<RecError>(null);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  // Открыть микрофон/камеру (для видео — чтобы показать превью до записи)
  const open = useCallback(
    async (facing: "user" | "environment" = "user") => {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("unsupported");
        return null;
      }
      try {
        stopTracks();
        const s = await navigator.mediaDevices.getUserMedia(
          kind === "audio"
            ? { audio: { echoCancellation: true, noiseSuppression: true } }
            : {
                audio: true,
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
              },
        );
        streamRef.current = s;
        setStream(s);
        setState((st) => (st === "idle" ? "preview" : st));
        return s;
      } catch {
        setError("denied");
        return null;
      }
    },
    [kind, stopTracks],
  );

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    const s = streamRef.current ?? (await open());
    if (!s) return;
    const mimeType = pickMime(kind);
    const rec = new MediaRecorder(s, {
      ...(mimeType ? { mimeType } : {}),
      // битрейт держим скромным, чтобы файлы быстро грузились по мобильному интернету
      ...(kind === "video" ? { videoBitsPerSecond: 2_000_000, audioBitsPerSecond: 96_000 } : { audioBitsPerSecond: 96_000 }),
    });
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || (kind === "audio" ? "audio/webm" : "video/webm");
      setBlob(new Blob(chunks.current, { type: type.split(";")[0] }));
      setSeconds((Date.now() - startedAt.current) / 1000);
      setState("done");
      if (kind === "audio") stopTracks(); // микрофон гасим сразу, камеру — при уходе с экрана
    };
    recorder.current = rec;
    rec.start(250);
    startedAt.current = Date.now();
    setSeconds(0);
    setState("recording");
    timer.current = setInterval(() => {
      const sec = (Date.now() - startedAt.current) / 1000;
      setSeconds(sec);
      if (sec >= maxSec) stop();
    }, 200);
  }, [kind, maxSec, open, stop, stopTracks]);

  const reset = useCallback(() => {
    stop();
    setBlob(null);
    setSeconds(0);
    setState(streamRef.current ? "preview" : "idle");
  }, [stop]);

  // При уходе с экрана всё выключаем
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    },
    [],
  );

  return { state, error, seconds, blob, stream, open, start, stop, reset, stopTracks, setBlob, setSeconds, setState };
}
