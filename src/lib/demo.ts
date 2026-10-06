"use client";

// Сквозной демо-режим: открыть сайт с ?demo — и весь путь от портала до финала
// идёт на подложках вместо настоящего контента. Режим запоминается до закрытия вкладки.
// Выйти: открыть любую страницу с ?demo=0.
const KEY = "sonya_demo";

export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  try {
    if (p.get("demo") === "0") {
      sessionStorage.removeItem(KEY);
      return false;
    }
    if (p.has("demo")) {
      sessionStorage.setItem(KEY, "1");
      return true;
    }
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return p.has("demo") && p.get("demo") !== "0";
  }
}

// Подписи-подложки
export const demoName = (i: number) => `демо ${i + 1}`;
