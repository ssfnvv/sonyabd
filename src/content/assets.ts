// Реестр вырезанных картинок (лежат в /public/scrap/<id>.webp).
// Размеры и окошки рамок посчитаны скриптом нарезки и сохранены в assets.json.
import raw from "./assets.json";

export type AssetGroup = "frame" | "paper" | "clip" | "cat" | "lace" | "decor"; // decor — только для оформления актов, в редакторе не показывается
export type Asset = {
  id: string;
  group: AssetGroup;
  w: number;
  h: number;
  windows?: [number, number, number, number][]; // [x, y, w, h] в долях картинки
};

export const ASSETS: Record<string, Asset> = Object.fromEntries(
  Object.entries(raw as unknown as Record<string, Omit<Asset, "id">>).map(([id, a]) => [id, { id, ...a }]),
);

export const assetsByGroup = (g: AssetGroup) => Object.values(ASSETS).filter((a) => a.group === g);

export const assetUrl = (id: string) => `/scrap/${id}.webp`;
export const assetThumbUrl = (id: string) => `/scrap/thumb/${id}.webp`;

export const assetAspect = (id: string) => {
  const a = ASSETS[id];
  return a ? a.h / a.w : 1;
};

// Общий прямоугольник всех окошек рамки — туда целиком кладём фото
// (у плёнки и кулона окошек несколько, фото «просвечивает» через все)
export function assetUnionWindow(id: string): [number, number, number, number] {
  const ws = ASSETS[id]?.windows;
  if (!ws?.length) return [0.1, 0.1, 0.8, 0.8];
  const x0 = Math.min(...ws.map((w) => w[0]));
  const y0 = Math.min(...ws.map((w) => w[1]));
  const x1 = Math.max(...ws.map((w) => w[0] + w[2]));
  const y1 = Math.max(...ws.map((w) => w[1] + w[3]));
  return [x0, y0, x1 - x0, y1 - y0];
}

export const isAssetId = (id: unknown): id is string => typeof id === "string" && id in ASSETS;
