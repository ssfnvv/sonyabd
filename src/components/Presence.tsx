"use client";

// Отметка «я на сайте» для статистики в админке. Раз в 20 секунд и при смене страницы.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function sessionId(): string {
  try {
    let s = sessionStorage.getItem("sonya_sid");
    if (!s) {
      s = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("sonya_sid", s);
    }
    return s;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2, 12);
  }
}

function friendId(): string | undefined {
  try {
    return JSON.parse(localStorage.getItem("sonya_friend") ?? "null")?.id;
  } catch {
    return undefined;
  }
}

export function Presence() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid: sessionId(), friendId: friendId(), path }),
        keepalive: true,
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 20_000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [path]);
  return null;
}
