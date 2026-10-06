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

// Все форматы, которые браузер говорит, что умеет, — по порядку предпочтения.
// Пустая строка в конце = «формат на выбор браузера».
function supportedMimes(kind: "audio" | "video"): string[] {
  if (typeof MediaRecorder === "undefined") return [];
  const list = (kind === "audio" ? AUDIO_TYPES : VIDEO_TYPES).filter((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
  return [...list, ""];
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
  const userStopped = useRef(false); // true — запись остановил человек (или лимит времени)
  // журнал попыток записи — показываем, если запись оборвалась, чтобы понять причину
  const [debug, setDebug] = useState<string>("");
  const log = useRef<string[]>([]);

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
    userStopped.current = true;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  // Некоторые браузеры (например, Яндекс на Mac) говорят «умею MP4», начинают запись
  // и через секунду падают. Поэтому: если запись оборвалась сама, без нажатия «Стоп»,
  // сразу пробуем следующий формат из списка — незаметно для человека.
  const startWith = useCallback(
    (s: MediaStream, mimes: string[], i: number) => {
      const mimeType = mimes[i];
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(s, {
          ...(mimeType ? { mimeType } : {}),
          // битрейт держим скромным, чтобы файлы быстро грузились по мобильному интернету
          ...(kind === "video" ? { videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 96_000 } : { audioBitsPerSecond: 96_000 }),
        });
      } catch {
        if (i + 1 < mimes.length) return startWith(s, mimes, i + 1);
        setError("unsupported");
        return;
      }
      const startedThis = Date.now();
      const localChunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };
      let errName = "";
      rec.onerror = (ev) => {
        const er = (ev as unknown as { error?: DOMException }).error;
        errName = er ? `${er.name}:${er.message}` : "error";
      };
      s.getTracks().forEach((tr) => {
        tr.onended = () => log.current.push(`${tr.kind} ended`);
      });
      rec.onstop = () => {
        const crashed = !userStopped.current && Date.now() - startedThis < maxSec * 1000 - 300;
        const bytes = localChunks.reduce((n, c) => n + c.size, 0);
        const empty = bytes < 1000;
        log.current.push(`${mimeType || "auto"} ${Date.now() - startedThis}ms ${bytes}b ${errName}`.trim());
        setDebug(log.current.join(" | "));
        if ((crashed || empty) && i + 1 < mimes.length && recorder.current === rec) {
          // формат не взлетел — пробуем следующий, таймер начинаем заново
          startWith(s, mimes, i + 1);
          return;
        }
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        const type = rec.mimeType || mimeType || (kind === "audio" ? "audio/webm" : "video/webm");
        chunks.current = localChunks;
        setBlob(new Blob(localChunks, { type: type.split(";")[0] }));
        setSeconds((Date.now() - startedAt.current) / 1000);
        setState("done");
        if (kind === "audio") stopTracks(); // микрофон гасим сразу, камеру — при уходе с экрана
      };
      recorder.current = rec;
      try {
        rec.start(250);
      } catch {
        if (i + 1 < mimes.length) return startWith(s, mimes, i + 1);
        setError("unsupported");
        return;
      }
      startedAt.current = Date.now();
      setSeconds(0);
      setState("recording");
    },
    [kind, maxSec, stopTracks],
  );

  const start = useCallback(async () => {
    const s = streamRef.current ?? (await open());
    if (!s) return;
    userStopped.current = false;
    log.current = [];
    setDebug("");
    startWith(s, supportedMimes(kind), 0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const sec = (Date.now() - startedAt.current) / 1000;
      setSeconds(sec);
      if (sec >= maxSec) stop();
    }, 200);
  }, [kind, maxSec, open, startWith]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return { debug, state, error, seconds, blob, stream, open, start, stop, reset, stopTracks, setBlob, setSeconds, setState };
}
