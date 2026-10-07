"use client";

// Постер в серебряной рамке (акт 2 и страница-архив): фото друзей плотной мозаикой
// в две колонки, истории журнальным шрифтом, крупные годы у самых популярных лет.
import { motion } from "framer-motion";
import "@fontsource/pt-serif/cyrillic-400.css";
import "@fontsource/pt-serif/cyrillic-400-italic.css";
import "@fontsource/pt-serif/latin-400.css";
import "@fontsource/pt-serif/latin-400-italic.css";
import "@fontsource/playfair-display/cyrillic-700.css";
import "@fontsource/playfair-display/latin-700.css";
import { CARD_ASPECT, elementAspect, mediaUrl, type CardElement } from "@/lib/media";
import { CardElementView, CardLayer } from "@/components/CardView";
import { hash } from "./RansomText";
import { Marker, type MarkerKind } from "./Marker";

const YEAR_MIN_PEOPLE = 3;
const YEAR_MAX_SHOWN = 4;

export type Card = { id: string; year: number; story: string; elements: CardElement[]; name: string };

// Плитка мозаики; wide — на всю ширину листа (крупные горизонтальные фото и годы)
type TileT =
  | { kind: "photo"; key: string; el: CardElement; name: string; wide: boolean; sticker?: CardElement; doodle?: MarkerKind }
  | { kind: "card"; key: string; card: Card; wide: false }
  | { kind: "story"; key: string; story: string; name: string; wide: false }
  | { kind: "year"; key: string; year: number; wide: true };

const DOODLES: MarkerKind[] = ["tick", "sparkle2", "star", "heart", "burst", "arrow"];

// Горизонтальные фото иногда делаем крупными — на всю ширину
const isWide = (aspect: number, seed: string) => aspect < 0.85 && hash(seed + "wide") > 0.55;

function buildTiles(cards: Card[]): TileT[] {
  const count = new Map<number, number>();
  cards.forEach((c) => count.set(c.year, (count.get(c.year) ?? 0) + 1));
  // крупные цифры — только у самых популярных лет (не больше YEAR_MAX_SHOWN), чтобы мозаика не дробилась
  const topYears = new Set(
    [...count.entries()]
      .filter(([, n]) => n >= YEAR_MIN_PEOPLE)
      .sort((x, y) => y[1] - x[1] || x[0] - y[0])
      .slice(0, YEAR_MAX_SHOWN)
      .map(([y]) => y),
  );
  const yearShown = new Set<number>();
  const tiles: TileT[] = [];

  cards.forEach((card, ci) => {
    if (topYears.has(card.year) && !yearShown.has(card.year)) {
      yearShown.add(card.year);
      tiles.push({ kind: "year", key: `y${card.year}`, year: card.year, wide: true });
    }
    const els = [...card.elements].sort((a, b) => a.z - b.z);
    const photos = els.filter((e) => e.kind === "photo" || e.kind === "frame").slice(0, 4);
    const stickers = els.filter((e) => e.kind === "sticker" || e.kind === "asset");

    if (!photos.length) {
      tiles.push({ kind: "card", key: card.id, card, wide: false });
    } else {
      photos.forEach((e, k) => {
        tiles.push({
          kind: "photo",
          key: e.id,
          el: e,
          name: k === 0 ? card.name : "",
          wide: e.kind === "photo" && isWide(elementAspect(e), e.id),
          // одна наклейка друга на его первое фото — без перебора
          sticker: k === 0 ? stickers[0] : undefined,
          // маркерный каракуль — на каждом третьем друге
          doodle: k === 0 && ci % 3 === 1 ? DOODLES[ci % DOODLES.length] : undefined,
        });
      });
    }
    if (card.story) tiles.push({ kind: "story", key: `s${card.id}`, story: card.story, name: card.name, wide: false });
  });
  return tiles;
}

// Примерная высота плитки в долях ширины колонки — чтобы раскладывать по колонкам ровно
function estHeight(tl: TileT): number {
  if (tl.kind === "photo") return tl.el.kind === "frame" ? elementAspect(tl.el) * 1.12 : elementAspect(tl.el);
  if (tl.kind === "card") return CARD_ASPECT;
  if (tl.kind === "story") {
    // ~24 знака в строке на телефоне, строка ≈ 0.1 ширины, плюс поля и подпись
    const lines = tl.story.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 24)), 0);
    return 0.28 + lines * 0.1;
  }
  return 0.4;
}

// Плитки участка → две колонки: каждую следующую кладём в ту, что ниже
function toColumns(tiles: TileT[]): [TileT[], TileT[]] {
  const cols: [TileT[], TileT[]] = [[], []];
  const h = [0, 0];
  for (const tl of tiles) {
    const k = h[0] <= h[1] ? 0 : 1;
    cols[k].push(tl);
    h[k] += estHeight(tl) + 0.04;
  }
  return cols;
}

// Режем ленту плиток на участки: подряд идущие обычные → один участок в 2 колонки, широкие — отдельно
function segments(tiles: TileT[]): { wide: boolean; tiles: TileT[] }[] {
  const out: { wide: boolean; tiles: TileT[] }[] = [];
  for (const tl of tiles) {
    if (tl.wide) out.push({ wide: true, tiles: [tl] });
    else if (out.length && !out[out.length - 1].wide) out[out.length - 1].tiles.push(tl);
    else out.push({ wide: false, tiles: [tl] });
  }
  return out;
}

export function Poster({ cards }: { cards: Card[] }) {
  const tiles = buildTiles(cards);
  if (!tiles.length) return null;
  return (
          <motion.div
            className="w-full rounded-[6px] p-[10px] shadow-[0_20px_40px_-18px_rgba(60,30,50,.5)]"
            style={{ background: "linear-gradient(135deg,#f4f4f6 0%,#b9bcc4 22%,#eceef2 45%,#a7abb4 70%,#e7e9ee 100%)" }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 18 }}
          >
            <div className="bg-[#fbfbfa] p-[3%] shadow-[inset_0_0_0_1px_rgba(0,0,0,.06),inset_0_2px_6px_rgba(0,0,0,.12)]">
              {segments(tiles).map((seg, si) =>
                // одиночная плитка между широкими — тоже на всю ширину, чтобы рядом не было пустоты
                seg.wide || seg.tiles.length === 1 ? (
                  <div key={si} className="mb-[6px]">
                    <Tile tile={seg.tiles[0]} i={si} />
                  </div>
                ) : (
                  // две колонки одной высоты: последняя плитка в каждой дотягивается до низа — без дыр
                  <div key={si} className="mb-[6px] flex items-stretch gap-[6px]">
                    {toColumns(seg.tiles).map((col, ci) => (
                      <div key={ci} className="flex min-w-0 flex-1 flex-col gap-[6px]">
                        {col.map((tile, i) => (
                          <Tile key={tile.key} tile={tile} i={i * 2 + ci} grow={i === col.length - 1} />
                        ))}
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          </motion.div>
  );
}

function Tile({ tile, i, grow }: { tile: TileT; i: number; grow?: boolean }) {
  const style = {};
  const g = grow ? " flex-auto" : "";
  const appear = {
    initial: { opacity: 0, scale: 0.94 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "-5% 0px" },
    transition: { duration: 0.5, delay: (i % 4) * 0.05 },
  };

  if (tile.kind === "year")
    return (
      <motion.div style={style} className="flex items-center gap-3 py-1" {...appear}>
        <span className="h-px flex-1 bg-[#1d1b1c]/25" />
        <span className="text-[clamp(3rem,15vw,5.5rem)] font-bold leading-none tracking-tight text-[#1d1b1c]" style={{ fontFamily: '"Playfair Display", serif' }}>
          {tile.year}
        </span>
        <span className="h-px flex-1 bg-[#1d1b1c]/25" />
      </motion.div>
    );

  if (tile.kind === "story")
    return (
      <motion.div style={style} className={"flex flex-col justify-center bg-white px-3 py-3" + g} {...appear}>
        <p className="whitespace-pre-wrap text-[13px] leading-[1.32] text-[#1d1b1c]" style={{ fontFamily: '"PT Serif", Georgia, serif' }}>
          {tile.story}
        </p>
        {tile.name && (
          <p className="mt-1.5 text-right text-[14px] italic text-[#b0283f]" style={{ fontFamily: '"PT Serif", Georgia, serif' }}>
            — {tile.name}
          </p>
        )}
      </motion.div>
    );

  if (tile.kind === "card")
    return (
      <motion.div style={{ ...style, aspectRatio: `1 / ${CARD_ASPECT}` }} className={"relative overflow-hidden bg-[#fff6f9]" + g} {...appear}>
        <div className="absolute inset-0">
          <CardLayer elements={tile.card.elements} />
        </div>
        <Caption name={tile.card.name} />
      </motion.div>
    );

  // фото или рамка с фото
  const frame = tile.el.kind === "frame";
  return (
    <motion.div
      style={{ ...style, aspectRatio: `1 / ${frame ? elementAspect(tile.el) * 1.12 : elementAspect(tile.el)}` }}
      className={`relative ${frame ? "bg-[#f3f1ee]" : "bg-[#eee]"}${g}`}
      {...appear}
    >
      <div className="absolute inset-0 overflow-hidden">
        {frame ? (
          <div className="absolute left-1/2 top-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2" style={{ aspectRatio: `1 / ${elementAspect(tile.el)}` }}>
            <CardElementView e={tile.el} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(tile.el.src)} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
        )}
      </div>
      {tile.name && <Caption name={tile.name} />}

      {/* одна наклейка друга, чуть выходит за край фото */}
      {tile.sticker && (
        <motion.div
          className="pointer-events-none absolute -right-3 -top-4 z-10"
          style={{ aspectRatio: `1 / ${elementAspect(tile.sticker)}`, width: `min(30%, 5.5rem, ${(4.5 / elementAspect(tile.sticker)).toFixed(2)}rem)` }}
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: tile.sticker.rotation || 10 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, type: "spring", damping: 9, stiffness: 220 }}
        >
          <CardElementView e={tile.sticker} />
        </motion.div>
      )}
      {tile.doodle && <Marker kind={tile.doodle} className="-bottom-5 -left-4 z-10" size={42} rotate={-12} />}
    </motion.div>
  );
}

// подпись-имя на фото, как курсивная подпись в журнале
function Caption({ name }: { name: string }) {
  if (!name) return null;
  return (
    <span
      className="absolute bottom-0 left-0 z-[5] max-w-full truncate bg-white/90 px-2 py-0.5 text-[12px] italic text-[#1d1b1c]"
      style={{ fontFamily: '"PT Serif", Georgia, serif' }}
    >
      {name}
    </span>
  );
}
