import { ASSETS, assetAspect, assetUnionWindow, type AssetGroup } from "@/content/assets";

// Публичная ссылка на файл в хранилище. Идёт через наш домен (/sb → Supabase),
// чтобы фото и голосовые открывались в России без VPN.
export function mediaUrl(path: string): string {
  return `/sb/storage/v1/object/public/media/${path}`;
}

// Элемент карточки таймлайна
//   photo   — фото друга без рамки
//   sticker — нарисованный SVG-стикер (сердечки, бантики…)
//   asset   — вырезанная картинка: зажимы, котики, бумажки, кружево
//   frame   — рамка (фотоаппарат, телевизор, полароид…) с фото друга в окошке
export type CardElement = {
  id: string;
  kind: "photo" | "sticker" | "asset" | "frame";
  src: string; // photo → путь в хранилище; sticker/asset/frame → id
  photo?: string; // только для frame: путь фото в хранилище
  x: number; // центр, доля ширины холста (0..1)
  y: number; // центр, доля высоты холста (0..1)
  scale: number;
  rotation: number; // градусы
  z: number;
  aspect?: number; // для фото: высота / ширина
};

// Базовая ширина элемента относительно ширины холста (до масштабирования)
const GROUP_WIDTH: Record<AssetGroup, number> = {
  frame: 0.62,
  paper: 0.6,
  clip: 0.24,
  cat: 0.36,
  lace: 1.05,
  decor: 0.5,
};

export function baseWidth(e: Pick<CardElement, "kind" | "src">): number {
  if (e.kind === "photo") return 0.55;
  if (e.kind === "sticker") return 0.24;
  const a = ASSETS[e.src];
  return a ? GROUP_WIDTH[a.group] : 0.3;
}

// Высота / ширина элемента
export function elementAspect(e: Pick<CardElement, "kind" | "src" | "aspect">): number {
  if (e.kind === "photo") return e.aspect ?? 1;
  if (e.kind === "sticker") return 1;
  return assetAspect(e.src);
}

export { assetUnionWindow };

// Пропорции холста карточки: 4:5, как пост в соцсетях
export const CARD_ASPECT = 5 / 4;

// Годы для таймлайна: Соне 20, родилась в 2006
export const TIMELINE_YEARS = Array.from({ length: 2026 - 2006 + 1 }, (_, i) => 2006 + i);
