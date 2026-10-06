"use client";

// Акт 2: таймлайн-скрапбук. Годы — заголовки из букв-вырезок, между годами кружево.
// Карточки друзей «падают» на стол при прокрутке и прикалываются зажимами и кнопками,
// история написана от руки на клочке бумаги, иногда из-за карточки выглядывает котик.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { copy } from "@/content/copy";
import { CARD_ASPECT, type CardElement } from "@/lib/media";
import { assetsByGroup, assetUrl } from "@/content/assets";
import { CardLayer } from "@/components/CardView";
import { ActShell } from "@/components/acts/ActShell";
import { RansomText, hash } from "@/components/acts/RansomText";
import { cn } from "@/components/ui";

const t = copy.act2;

type Card = { id: string; year: number; story: string; elements: CardElement[]; name: string };

// Отступы текста внутри каждой бумажки (верх/право/низ/лево), чтобы не залезать на скотч и края
const PAPER_PAD: Record<string, string> = {
  "note-clip": "18% 18% 16% 14%",
  "note-kraft": "16% 12% 16% 18%",
  "note-grid": "20% 14% 14% 16%",
  "note-lined": "12% 8% 24% 22%",
  "note-crumpled": "18% 12% 12% 14%",
};

// Ширина бумажки: вытянутые по горизонтали — шире, квадратные — уже
const PAPER_WIDTH: Record<string, string> = {
  "note-lined": "94%",
  "note-kraft": "74%",
  "note-grid": "72%",
  "note-clip": "70%",
  "note-crumpled": "64%",
};

// Фоны карточек — как разная бумага
const CARD_PAPERS = ["#fffdf8", "#fff6ec", "#fdeef3", "#f7f1e6"];

export default function Act2() {
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    // /act2?demo — показать пример с картинками-заглушками, пока друзья не загрузили своё
    if (new URLSearchParams(window.location.search).has("demo")) return setCards(demoCards());
    fetch("/api/public/timeline")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // группируем по годам (годы без карточек просто не появляются)
  const years = useMemo(() => {
    const map = new Map<number, Card[]>();
    (cards ?? []).forEach((c) => map.set(c.year, [...(map.get(c.year) ?? []), c]));
    return [...map.entries()];
  }, [cards]);

  // сверху карточку «прикалывают» только невысокие предметы: зажимы, бантики, скотч
  const clips = assetsByGroup("clip").filter((a) => a.h / a.w < 1.05);
  const cats = assetsByGroup("cat");
  const laces = assetsByGroup("lace");
  const papers = assetsByGroup("paper");

  let cardIndex = 0;

  return (
    <ActShell back="/act1" className="scrap-desk">
      <div className="mx-auto flex max-w-md flex-col items-center px-5 pb-24 pt-20">
        {t.title && (
          <h1 className="mb-10 text-center">
            <RansomText text={t.title} size={34} />
          </h1>
        )}

        {cards === null && <div className="mt-40 size-10 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />}

        {years.map(([year, list], yi) => {
          const lace = laces.length ? laces[Math.floor(hash(`lace${year}`) * laces.length)] : null;
          return (
            <section key={year} className="flex w-full flex-col items-center">
              {/* кружевной разделитель */}
              {yi > 0 && lace && (
                <motion.div
                  className="-mx-10 my-8 h-11 w-[calc(100%+5rem)]"
                  style={{ rotate: `${(hash(`lr${year}`) - 0.5) * 5}deg` }}
                  initial="hidden"
                  whileInView="shown"
                  viewport={{ once: true }}
                >
                  {/* кружево «разматывается» слева направо */}
                  <motion.div
                    className="h-full"
                    style={{ backgroundImage: `url(${assetUrl(lace.id)})`, backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }}
                    variants={{ hidden: { width: "0%" }, shown: { width: "100%" } }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                </motion.div>
              )}

              {/* год из букв-вырезок */}
              <motion.h2
                className="mb-14 mt-6"
                initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ type: "spring", damping: 11, stiffness: 140 }}
              >
                <RansomText text={String(year)} size={52} />
              </motion.h2>

              {list.map((card) => {
                const i = cardIndex++;
                const r = (k: string) => hash(card.id + k);
                const tilt = (i % 2 ? 1 : -1) * (1.5 + r("t") * 3);
                const clip = clips.length ? clips[Math.floor(r("c") * clips.length)] : null;
                const cat = cats.length && i % 3 === 1 ? cats[Math.floor(r("k") * cats.length)] : null;
                const catLeft = r("s") > 0.5;
                const paper = papers.length ? papers[Math.floor(r("p") * papers.length)] : null;
                return (
                  <div key={card.id} className="relative mb-16 w-full">
                    {/* котик выглядывает из-за карточки */}
                    {cat && (
                      <motion.img
                        src={assetUrl(cat.id)}
                        alt=""
                        className={cn("pointer-events-none absolute -top-[11%] z-0 w-[30%]", catLeft ? "left-[6%]" : "right-[6%]")}
                        initial={{ y: "45%", rotate: 0 }}
                        whileInView={{ y: "0%", rotate: catLeft ? -8 : 8 }}
                        viewport={{ once: true, margin: "-20% 0px" }}
                        transition={{ delay: 1, type: "spring", damping: 10, stiffness: 120 }}
                      />
                    )}

                    {/* карточка падает на стол */}
                    <motion.div
                      className="relative z-10"
                      initial={{ opacity: 0, y: -90, scale: 1.12, rotate: tilt - 14 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
                      viewport={{ once: true, margin: "-12% 0px" }}
                      transition={{ type: "spring", damping: 14, stiffness: 110 }}
                    >
                      <div
                        className="relative w-full overflow-hidden rounded-[4px] shadow-[0_14px_28px_-10px_rgba(90,30,50,.45),0_2px_4px_rgba(90,30,50,.15)]"
                        style={{ aspectRatio: `1 / ${CARD_ASPECT}`, background: CARD_PAPERS[Math.floor(r("bg") * CARD_PAPERS.length)] }}
                      >
                        <CardLayer elements={card.elements} />
                      </div>

                      {/* зажим или кнопка сверху «прикалывает» карточку */}
                      {clip && (
                        <motion.img
                          src={assetUrl(clip.id)}
                          alt=""
                          className="pointer-events-none absolute -top-7 left-1/2 z-20 w-[26%] -translate-x-1/2"
                          style={{ marginLeft: `${(r("cx") - 0.5) * 30}%` }}
                          initial={{ y: -40, opacity: 0, rotate: 0 }}
                          whileInView={{ y: 0, opacity: 1, rotate: (r("cr") - 0.5) * 30 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.55, type: "spring", damping: 8, stiffness: 260 }}
                        />
                      )}
                    </motion.div>

                    {/* история на клочке бумаги */}
                    {(card.story || card.name) && (
                      <motion.div
                        className="relative z-20 mx-auto -mt-8"
                        style={{ width: paper ? PAPER_WIDTH[paper.id] ?? "76%" : "84%" }}
                        initial={{ opacity: 0, y: 30, rotate: -tilt * 1.6 }}
                        whileInView={{ opacity: 1, y: 0, rotate: -tilt * 0.8 }}
                        viewport={{ once: true, margin: "-8% 0px" }}
                        transition={{ delay: 0.35, type: "spring", damping: 16 }}
                      >
                        <div
                          className="flex flex-col justify-center drop-shadow-[0_6px_8px_rgba(90,30,50,.2)]"
                          style={
                            paper
                              ? {
                                  backgroundImage: `url(${assetUrl(paper.id)})`,
                                  backgroundSize: "100% 100%",
                                  // пропорции бумажки сохраняются; если текст длинный — она вытягивается вниз
                                  aspectRatio: `${paper.w} / ${paper.h}`,
                                  padding: PAPER_PAD[paper.id] ?? "16% 15%",
                                }
                              : { background: "#fffdf8", padding: "10%" }
                          }
                        >
                          {card.story && (
                            <p className="whitespace-pre-wrap font-[Caveat] text-[1.45rem] font-bold leading-[1.15] text-[#4a2a36]">
                              {card.story}
                            </p>
                          )}
                          {card.name && (
                            <p className="mt-2 self-end font-[Caveat] text-[1.6rem] font-bold leading-none text-pink-deep">{card.name}</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}

        {cards !== null && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10">
            <Link
              href="/act3"
              className="inline-block rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]"
            >
              {t.next}
            </Link>
          </motion.div>
        )}
      </div>
    </ActShell>
  );
}


// ---------- демо-режим ----------
// Заглушка вместо фото: мягкий градиент
const DEMO_PHOTOS = [
  ["#f9c5d5", "#fff3e3"],
  ["#cfe0f5", "#fde4ec"],
  ["#f6cf7a", "#f7a8c0"],
  ["#bfe3d0", "#fff8f0"],
].map(
  ([a, b]) =>
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="300" cy="90" r="40" fill="#fff" opacity=".6"/></svg>`,
    ),
);

function demoCards(): Card[] {
  const frames = assetsByGroup("frame");
  // сверху карточку «прикалывают» только невысокие предметы: зажимы, бантики, скотч
  const clips = assetsByGroup("clip").filter((a) => a.h / a.w < 1.05);
  const cats = assetsByGroup("cat");
  const years = [2009, 2014, 2014, 2019, 2023, 2025];
  return years.map((year, i) => {
    const f = frames[i % Math.max(1, frames.length)];
    const els: CardElement[] = [];
    if (f) els.push({ id: `f${i}`, kind: "frame", src: f.id, photo: DEMO_PHOTOS[i % 4], x: 0.5, y: 0.42, scale: 1.35, rotation: -4 + i * 2, z: 1 });
    if (clips[i]) els.push({ id: `c${i}`, kind: "asset", src: clips[(i * 5) % clips.length].id, x: 0.22, y: 0.82, scale: 1.2, rotation: 12, z: 2 });
    if (i % 2 === 0) els.push({ id: `s${i}`, kind: "sticker", src: ["heart", "star", "bow"][i % 3], x: 0.8, y: 0.85, scale: 1, rotation: -10, z: 3 });
    if (i === 3 && cats[0]) els.push({ id: `k${i}`, kind: "asset", src: cats[2 % cats.length].id, x: 0.75, y: 0.78, scale: 1, rotation: 6, z: 4 });
    // в демо вместо историй — заглушка, настоящие тексты пишут друзья
    return { id: `demo-${i}`, year, story: "…", elements: els, name: "…" };
  });
}
