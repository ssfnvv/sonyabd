"use client";

// Если на странице всё-таки случилась ошибка — показываем кнопку перезагрузки вместо белого экрана
// и печатаем ошибку в консоль, чтобы её можно было найти.
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="ru">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#fff8f0", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <button
            onClick={() => { reset(); location.reload(); }}
            aria-label="reload"
            style={{ width: 64, height: 64, borderRadius: 999, border: "none", background: "#e88aa8", color: "#fff", fontSize: 28 }}
          >
            ↻
          </button>
          <pre style={{ marginTop: 16, fontSize: 10, color: "#7a3b52aa", maxWidth: 340, whiteSpace: "pre-wrap", wordBreak: "break-all", textAlign: "left" }}>
            {[
              error?.message,
              typeof location !== "undefined" ? location.pathname + location.search : "",
              typeof navigator !== "undefined" ? navigator.userAgent : "",
              (error?.stack ?? "").split("\n").slice(0, 6).join("\n"),
            ].join("\n")}
          </pre>
        </div>
      </body>
    </html>
  );
}
