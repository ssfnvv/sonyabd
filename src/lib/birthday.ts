// Момент дня рождения: 8 октября 2026, 00:00 по Москве (UTC+3) = 7 октября 21:00 UTC
const REAL_TARGET = Date.parse("2026-10-07T21:00:00Z");

// Для проверки: /act1?test=15 — полночь наступит через 15 секунд после открытия
export function getTarget(): number {
  if (typeof window !== "undefined") {
    const test = new URLSearchParams(window.location.search).get("test");
    if (test && Number.isFinite(Number(test))) {
      const key = "sonya_test_target";
      const saved = sessionStorage.getItem(key);
      if (saved) return Number(saved);
      const t = Date.now() + Number(test) * 1000;
      sessionStorage.setItem(key, String(t));
      return t;
    }
  }
  return REAL_TARGET;
}
