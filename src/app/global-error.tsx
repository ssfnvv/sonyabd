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
          <p style={{ marginTop: 16, fontSize: 11, color: "#7a3b5299", maxWidth: 320, wordBreak: "break-word" }}>{error?.message}</p>
        </div>
      </body>
    </html>
  );
}
