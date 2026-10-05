// Публичная ссылка на файл в хранилище (работает и на сервере, и в браузере)
export function mediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/media/${path}`;
}

// Элемент карточки таймлайна
export type CardElement = {
  id: string;
  kind: "photo" | "sticker";
  src: string; // для фото — путь в хранилище, для стикера — id стикера
  x: number; // центр, доля ширины холста (0..1)
  y: number; // центр, доля высоты холста (0..1)
  scale: number;
  rotation: number; // градусы
  z: number;
  aspect?: number; // для фото: высота / ширина
};

// Базовая ширина элемента относительно ширины холста (до масштабирования)
export const BASE_WIDTH = { photo: 0.55, sticker: 0.24 } as const;

// Пропорции холста карточки: 4:5, как пост в соцсетях
export const CARD_ASPECT = 5 / 4;

// Годы для таймлайна: Соне 20, родилась в 2006
export const TIMELINE_YEARS = Array.from({ length: 2026 - 2006 + 1 }, (_, i) => 2006 + i);
