"use client";

// Акт 2: один большой постер в серебряной рамке (по референсу владелицы).
// Фото друзей — плотной мозаикой на всю площадь листа, разных размеров, почти без зазоров.
// Между фото — плитки с историями журнальным шрифтом с засечками и подписью-именем.
// Если один год выбрали 3+ человека — крупная цифра года с засечками, как «23» на референсе.
// Стикеры и маркерные каракули — совсем чуть-чуть, чтобы не перегружать.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import "@fontsource/pt-serif/cyrillic-400.css";
import "@fontsource/pt-serif/cyrillic-400-italic.css";
import "@fontsource/pt-serif/latin-400.css";
import "@fontsource/pt-serif/latin-400-italic.css";
import "@fontsource/playfair-display/cyrillic-700.css";
import "@fontsource/playfair-display/latin-700.css";
import { copy } from "@/content/copy";
import { CARD_ASPECT, elementAspect, mediaUrl, type CardElement } from "@/lib/media";
import { CardElementView, CardLayer } from "@/components/CardView";
import { ActShell } from "@/components/acts/ActShell";
import { PeekCat } from "@/components/acts/PeekCat";
import { hash } from "@/components/acts/RansomText";
import { Marker, type MarkerKind } from "@/components/acts/Marker";
import { Meme } from "@/components/acts/Meme";

const t = copy.act2;
const YEAR_MIN_PEOPLE = 3;

type Card = { id: string; year: number; story: string; elements: CardElement[]; name: string };

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
  const yearShown = new Set<number>();
  const tiles: TileT[] = [];

  cards.forEach((card, ci) => {
    if ((count.get(card.year) ?? 0) >= YEAR_MIN_PEOPLE && !yearShown.has(card.year)) {
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

export default function Act2() {
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    fetch("/api/public/timeline")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  const tiles = useMemo(() => (cards ? buildTiles(cards) : []), [cards]);

  return (
    <ActShell back="/act1" className="scrap-desk">
      <PeekCat cat="cat-glasses" edge="bottom-right" size={110} delay={2.5} />
      <div className="mx-auto flex max-w-xl flex-col items-center px-3 pb-24 pt-20">
        {cards === null && <div className="mt-40 size-10 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />}

        {cards !== null && tiles.length > 0 && (
          // постер в серебряной рамке
          <motion.div
            className="relative w-full rounded-[6px] p-[10px] shadow-[0_20px_40px_-18px_rgba(60,30,50,.5)]"
            style={{ background: "linear-gradient(135deg,#f4f4f6 0%,#b9bcc4 22%,#eceef2 45%,#a7abb4 70%,#e7e9ee 100%)" }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 18 }}
          >
            {/* мемы, «прилепленные» к углам рамки */}
            <Meme id="meme-strawberry" className="-right-4 -top-12 w-[24%] max-w-[110px]" rot={12} delay={1.2} />
            <Meme id="meme-romance" className="-bottom-10 -left-3 z-30 w-[44%] max-w-[210px]" rot={-7} inView />
            <div className="bg-[#fbfbfa] p-[3%] shadow-[inset_0_0_0_1px_rgba(0,0,0,.06),inset_0_2px_6px_rgba(0,0,0,.12)]">
              {segments(tiles).map((seg, si) =>
                seg.wide ? (
                  <div key={si} className="mb-[6px]">
                    <Tile tile={seg.tiles[0]} i={si} />
                  </div>
                ) : (
                  // колонки сами выравниваются по высоте — без дыр
                  <div key={si} className="mb-[6px] columns-2 gap-[6px]">
                    {seg.tiles.map((tile, i) => (
                      <div key={tile.key} className="mb-[6px] break-inside-avoid">
                        <Tile tile={tile} i={i} />
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          </motion.div>
        )}

        {cards !== null && (
          <Link
            href="/act3"
            className="mt-16 inline-block rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]"
          >
            {t.next}
          </Link>
        )}
      </div>
    </ActShell>
  );
}

function Tile({ tile, i }: { tile: TileT; i: number }) {
  const style = {};
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
      <motion.div style={style} className="flex flex-col justify-center bg-white px-3 py-3" {...appear}>
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
      <motion.div style={{ ...style, aspectRatio: `1 / ${CARD_ASPECT}` }} className="relative overflow-hidden bg-[#fff6f9]" {...appear}>
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
      className={`relative ${frame ? "bg-[#f3f1ee]" : "bg-[#eee]"}`}
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
          className="pointer-events-none absolute -right-3 -top-4 z-10 w-[34%] max-w-24"
          style={{ aspectRatio: `1 / ${elementAspect(tile.sticker)}` }}
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
