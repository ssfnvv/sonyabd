"use client";

// Постер в серебряной рамке (акт 2 и страница-архив). Внутри — карточки друзей ровно такими,
// какими они собрали их в редакторе: фото, рамки, наклейки на своих местах. Две колонки,
// под карточкой — имя и начало истории. Тап по карточке — открывается крупно, с историей целиком.
// Крупная цифра года — только у самых популярных лет.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import "@fontsource/pt-serif/cyrillic-400.css";
import "@fontsource/pt-serif/cyrillic-400-italic.css";
import "@fontsource/pt-serif/latin-400.css";
import "@fontsource/pt-serif/latin-400-italic.css";
import "@fontsource/playfair-display/cyrillic-700.css";
import "@fontsource/playfair-display/latin-700.css";
import { CARD_ASPECT, type CardElement } from "@/lib/media";
import { CardLayer } from "@/components/CardView";
import { hash, RansomText } from "./RansomText";
import { Marker, type MarkerKind } from "./Marker";

const YEAR_MIN_PEOPLE = 3;
const YEAR_MAX_SHOWN = 4;
// элементы, которые на постере не показываем (розовая скрепка — по просьбе владелицы)
const HIDDEN_ON_POSTER = new Set(["paperclip-pink"]);
const visible = (els: CardElement[]) => els.filter((e) => !HIDDEN_ON_POSTER.has(e.src));

// детские фото Сони в начале постера (лежат в /public/childhood)
const CHILDHOOD_CAPTION = "когда-то давным-давно";
const ENDING_CAPTION = "впереди ещё столько всего!";
const CHILDHOOD = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ src: `/childhood/${n}.jpg`, big: n === 1 || n === 5 }));

const SERIF = '"PT Serif", Georgia, serif';

export type Card = { id: string; year: number; story: string; elements: CardElement[]; name: string };

type Item = { kind: "year"; key: string; year: number } | { kind: "card"; key: string; card: Card; i: number; big: boolean };

const DOODLES: MarkerKind[] = ["tick", "sparkle2", "star", "heart", "burst", "arrow"];

function buildItems(cards: Card[]): Item[] {
  const count = new Map<number, number>();
  cards.forEach((c) => count.set(c.year, (count.get(c.year) ?? 0) + 1));
  // крупные цифры — только у самых популярных лет, чтобы не дробить постер
  const topYears = new Set(
    [...count.entries()]
      .filter(([, n]) => n >= YEAR_MIN_PEOPLE)
      .sort((x, y) => y[1] - x[1] || x[0] - y[0])
      .slice(0, YEAR_MAX_SHOWN)
      .map(([y]) => y),
  );
  const shown = new Set<number>();
  const out: Item[] = [];
  cards.forEach((card, i) => {
    if (topYears.has(card.year) && !shown.has(card.year)) {
      shown.add(card.year);
      out.push({ kind: "year", key: `y${card.year}`, year: card.year });
    }
    out.push({ kind: "card", key: card.id, card, i, big: false });
  });

  // Размеры: часть карточек — крупные, на всю ширину, остальные — по две в ряд.
  // Считаем по участкам между годами, чтобы в рядах не оставалось пустых клеток.
  let run: Extract<Item, { kind: "card" }>[] = [];
  const flush = () => {
    run.forEach((it, k) => {
      // ритм «крупная, две пары мелких»: мелкие всегда идут парами, рядом с ними нет пустых клеток
      it.big = run.length >= 3 && k % 5 === 0;
    });
    // если мелких нечётное число — последнюю мелкую делаем крупной, чтобы ряд не остался с дыркой
    const small = run.filter((it) => !it.big);
    if (small.length % 2 === 1) small[small.length - 1].big = true;
    run = [];
  };
  out.forEach((it) => {
    if (it.kind === "year") flush();
    else run.push(it);
  });
  flush();
  return out;
}

// фон карточки — как в редакторе, где друзья её собирали: белый в розовый горошек
const cardBg: React.CSSProperties = {
  aspectRatio: `1 / ${CARD_ASPECT}`,
  backgroundColor: "#fff",
  backgroundImage: "radial-gradient(var(--pink-soft) 1.5px, transparent 1.5px)",
  backgroundSize: "18px 18px",
};

export function Poster({ cards }: { cards: Card[] }) {
  const [open, setOpen] = useState<Card | null>(null);
  const items = buildItems(cards);
  if (!items.length) return null;

  return (
    <>
      <motion.div
        className="w-full rounded-[6px] p-[10px] shadow-[0_20px_40px_-18px_rgba(60,30,50,.5)]"
        style={{ background: "linear-gradient(135deg,#f4f4f6 0%,#b9bcc4 22%,#eceef2 45%,#a7abb4 70%,#e7e9ee 100%)" }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 18 }}
      >
        <div className="grid grid-flow-row-dense grid-cols-2 gap-x-3 gap-y-5 bg-[#fbfbfa] p-[4%] shadow-[inset_0_0_0_1px_rgba(0,0,0,.06),inset_0_2px_6px_rgba(0,0,0,.12)]">
          {/* начало постера: детские фото Сони и газетная подпись */}
          <motion.div
            className="col-span-2 flex justify-center pb-1 pt-2"
            initial={{ opacity: 0, scale: 1.2, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
            transition={{ type: "spring", damping: 11, delay: 0.3 }}
          >
            <RansomText text={CHILDHOOD_CAPTION} size={22} className="max-w-full" />
          </motion.div>
          {CHILDHOOD.map((ph, k) => (
            <motion.div
              key={ph.src}
              className={`bg-white p-[5px] pb-[14px] shadow-[0_6px_12px_-6px_rgba(60,30,50,.45)] ${ph.big ? "col-span-2 mx-[6%]" : ""}`}
              style={{ rotate: `${(hash(ph.src) - 0.5) * 5}deg` }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (k % 2) * 0.08 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.src} alt="" loading="lazy" className={`w-full object-cover ${ph.big ? "" : "aspect-square"}`} />
            </motion.div>
          ))}
          {items.map((it) =>
            it.kind === "year" ? (
              // год — цифрами, вырезанными из газет и журналов
              <motion.div
                key={it.key}
                className="col-span-2 flex items-center justify-center py-2"
                initial={{ opacity: 0, scale: 1.3, rotate: -6 }}
                whileInView={{ opacity: 1, scale: 1, rotate: (hash(it.key) - 0.5) * 6 }}
                viewport={{ once: true }}
                transition={{ type: "spring", damping: 11 }}
              >
                <RansomText text={String(it.year)} size={52} />
              </motion.div>
            ) : (
              <Block key={it.key} card={it.card} i={it.i} big={it.big} onOpen={() => setOpen(it.card)} />
            ),
          )}
          {/* завершающая газетная подпись */}
          <motion.div
            className="col-span-2 flex justify-center pb-2 pt-4"
            initial={{ opacity: 0, scale: 1.2, rotate: 4 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 1.5 }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 11 }}
          >
            <RansomText text={ENDING_CAPTION} size={22} className="max-w-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* крупный просмотр — поверх всего экрана (в body), чтобы его не перекрывали кнопки акта */}
      {typeof document !== "undefined" &&
        createPortal(<AnimatePresence>{open && <Lightbox card={open} onClose={() => setOpen(null)} />}</AnimatePresence>, document.body)}
    </>
  );
}

// карточка друга в сетке: сама карточка + имя + начало истории
function Block({ card, i, big, onOpen }: { card: Card; i: number; big: boolean; onOpen: () => void }) {
  const tilt = (hash(card.id + "t") - 0.5) * 3;
  const doodle = i % 4 === 1 ? DOODLES[i % DOODLES.length] : undefined;
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className={`relative flex min-w-0 flex-col text-left ${big ? "col-span-2 px-[6%]" : ""}`}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.45, delay: (i % 2) * 0.08 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="relative w-full overflow-hidden shadow-[0_6px_12px_-6px_rgba(60,30,50,.45)]" style={{ ...cardBg, rotate: `${tilt}deg` }}>
        <CardLayer elements={visible(card.elements)} />
      </div>
      {doodle && <Marker kind={doodle} className="-left-3 -top-4 z-10" size={36} rotate={-12} />}
      {card.name && (
        <p className={`mt-2 truncate italic ${big ? "text-[15px]" : "text-[13px]"} text-[#b0283f]`} style={{ fontFamily: SERIF }}>
          — {card.name}
        </p>
      )}
      {card.story && (
        <p className={`mt-0.5 whitespace-pre-wrap leading-[1.3] ${big ? "line-clamp-4 text-[14px]" : "line-clamp-3 text-[12px]"} text-[#1d1b1c]`}
          style={{ fontFamily: SERIF }}
        >
          {card.story}
        </p>
      )}
    </motion.button>
  );
}

// карточка крупно, с историей целиком
function Lightbox({ card, onClose }: { card: Card; onClose: () => void }) {
  // закрытие по «назад» на телефоне не трогаем — просто запрещаем прокрутку фона
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <motion.div
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#2a1520]/55 px-4 py-14 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative mx-auto w-full max-w-md bg-[#fbfbfa] p-3 pb-5 shadow-[0_24px_50px_-16px_rgba(0,0,0,.6)]"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full overflow-hidden" style={cardBg}>
          <CardLayer elements={visible(card.elements)} />
        </div>
        {card.story && (
          <p className="mt-4 whitespace-pre-wrap px-1 text-[15px] leading-[1.4] text-[#1d1b1c]" style={{ fontFamily: SERIF }}>
            {card.story}
          </p>
        )}
        {card.name && (
          <p className="mt-2 px-1 text-right text-[16px] italic text-[#b0283f]" style={{ fontFamily: SERIF }}>
            — {card.name}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          className="absolute -right-3 -top-3 grid size-10 place-items-center rounded-full bg-pink-deep text-white shadow-md active:scale-90"
        >
          <X className="size-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
