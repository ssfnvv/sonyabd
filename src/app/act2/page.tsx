"use client";

// Акт 2: большой коллаж на белой бумаге (по референсу владелицы).
// Фото друзей — редакционной раскладкой разных размеров, местами уходят за край экрана,
// приклеены синим скотчем; поверх — жёлтые маркерные каракули, которые сами прорисовываются.
// Стикеры/котики/рамки из карточки друга «прикалываются» к его фото.
// Годы не показываем — только если один год выбрали 3+ человека, рядом пишем его маркером в кружке.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { CARD_ASPECT, elementAspect, mediaUrl, type CardElement } from "@/lib/media";
import { CardElementView, CardLayer } from "@/components/CardView";
import { ActShell } from "@/components/acts/ActShell";
import { PeekCat } from "@/components/acts/PeekCat";
import { hash } from "@/components/acts/RansomText";
import { Marker, MARKER, type MarkerKind } from "@/components/acts/Marker";
import { cn } from "@/components/ui";

const t = copy.act2;
const YEAR_MIN_PEOPLE = 3;

type Card = { id: string; year: number; story: string; elements: CardElement[]; name: string };

// «Фото» в коллаже: обычное фото или рамка с фото внутри
type Tile = { key: string; aspect: number; el: CardElement };

function tilesOf(card: Card): { tiles: Tile[]; extras: CardElement[] } {
  const els = [...card.elements].sort((a, b) => a.z - b.z);
  const tiles = els
    .filter((e) => e.kind === "photo" || e.kind === "frame")
    .slice(0, 5)
    .map((e) => ({ key: e.id, aspect: elementAspect(e), el: e }));
  const extras = els.filter((e) => e.kind === "sticker" || e.kind === "asset").slice(0, 4);
  return { tiles, extras };
}

const DOODLE_SETS: MarkerKind[][] = [
  ["tick", "arrow", "wave"],
  ["sparkle2", "dashes", "excl"],
  ["star", "burst", "zigzag"],
  ["sun", "arrow2", "shapes"],
  ["crown", "tick", "heart"],
  ["smile", "sparkle2", "wave"],
];

export default function Act2() {
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    fetch("/api/public/timeline")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // годы, которые выбрали 3+ человека → подпишем маркером у первой карточки этого года
  const yearLabels = useMemo(() => {
    const count = new Map<number, number>();
    (cards ?? []).forEach((c) => count.set(c.year, (count.get(c.year) ?? 0) + 1));
    const seen = new Set<number>();
    const show = new Set<string>();
    (cards ?? []).forEach((c) => {
      if ((count.get(c.year) ?? 0) >= YEAR_MIN_PEOPLE && !seen.has(c.year)) {
        seen.add(c.year);
        show.add(c.id);
      }
    });
    return show;
  }, [cards]);

  return (
    <ActShell back="/act1" className="bg-[#fffefc]">
      <PeekCat cat="cat-glasses" edge="bottom-right" size={110} delay={2.5} />
      <div className="mx-auto flex max-w-md flex-col overflow-x-clip pb-24 pt-24">
        {cards === null && <div className="mx-auto mt-40 size-10 animate-spin rounded-full border-4 border-[#ffe28a] border-t-[#ffc21a]" />}

        {cards?.map((card, i) => (
          <Cluster key={card.id} card={card} index={i} showYear={yearLabels.has(card.id)} />
        ))}

        {cards !== null && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative mx-auto mt-12">
            <Marker kind="burst" className="-left-14 -top-6" size={44} />
            <Marker kind="tick" className="-right-12 -top-8" size={40} rotate={12} delay={0.2} />
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

// ---------- один друг: его фото, стикеры, история ----------
function Cluster({ card, index, showYear }: { card: Card; index: number; showYear: boolean }) {
  const r = (k: string) => hash(card.id + k);
  const { tiles, extras } = tilesOf(card);
  const right = index % 2 === 1; // зеркалим раскладку через одного
  const doodles = DOODLE_SETS[index % DOODLE_SETS.length];

  return (
    <section className="relative mb-16 px-5">
      {/* год маркером в кружке — только если его выбрали многие */}
      {showYear && (
        <motion.div
          className={cn("relative z-20 mb-3 w-fit px-4 py-2", right ? "ml-auto mr-4" : "ml-4")}
          initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
          whileInView={{ scale: 1, opacity: 1, rotate: -6 }}
          viewport={{ once: true }}
          transition={{ type: "spring", damping: 11 }}
        >
          <span className="font-hand relative z-10 text-5xl font-bold text-[#3a2430]">{card.year}</span>
          <svg viewBox="0 0 60 60" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
            <motion.path
              d="M30 6 C52 4 58 26 52 42 C46 56 14 56 7 40 C1 26 10 7 33 5"
              fill="none"
              stroke={MARKER}
              strokeWidth={2.4}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 3.5 }}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            />
          </svg>
        </motion.div>
      )}

      {/* каракули вокруг */}
      <Marker kind={doodles[0]} className={right ? "-left-1 top-2" : "-right-1 top-0"} size={48} rotate={(r("d0") - 0.5) * 40} />
      <Marker kind={doodles[1]} className={right ? "-right-2 top-1/2" : "-left-2 top-1/2"} size={52} rotate={(r("d1") - 0.5) * 40} delay={0.2} />

      {/* фото + стикеры друга, приколотые по углам фото (не залезают на текст) */}
      <div className="relative">
      {tiles.length === 0 ? (
        // только стикеры — показываем карточку целиком
        <Photo bleed={right ? "right" : "left"} tilt={(r("t") - 0.5) * 5} widthClass="w-[78%]" alignRight={right} aspect={CARD_ASPECT} tapeSeed={card.id}>
          <div className="relative size-full bg-[#fff6f9]">
            <CardLayer elements={card.elements} />
          </div>
        </Photo>
      ) : (
        <Layout tiles={tiles} right={right} seed={card.id} />
      )}

      {/* стикеры друга прикалываем по углам коллажа */}
      {extras.map((e, k) => {
        const spots: React.CSSProperties[] = [
          { left: "-2%", top: "-4%" },
          { right: "-1%", top: "18%" },
          { left: "4%", bottom: "16%" },
          { right: "8%", bottom: "4%" },
        ];
        return (
          <motion.div
            key={e.id}
            className="pointer-events-none absolute z-20"
            style={{ ...spots[(k + index) % spots.length], width: e.kind === "sticker" ? "22%" : "26%", aspectRatio: `1 / ${elementAspect(e)}` }}
            initial={{ scale: 0, rotate: e.rotation - 30 }}
            whileInView={{ scale: 1, rotate: e.rotation }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + k * 0.12, type: "spring", damping: 9, stiffness: 220 }}
          >
            <CardElementView e={e} />
          </motion.div>
        );
      })}
      </div>

      {/* история и имя */}
      {(card.story || card.name) && (
        <motion.div
          className={cn("relative z-10 mt-5 max-w-[86%]", right ? "ml-auto text-right" : "")}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {card.story && <p className="font-hand whitespace-pre-wrap text-[1.45rem] font-bold leading-[1.15] text-[#3a2430]">{card.story}</p>}
          {card.name && (
            <span className={cn("relative mt-1 inline-block", right ? "mr-1" : "ml-1")}>
              {/* жёлтый маркер-подчёркивание под именем */}
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute -left-2 bottom-0 h-3 w-[calc(100%+16px)]">
                <motion.path
                  d="M2 12 Q30 4 55 11 T98 9"
                  fill="none"
                  stroke={MARKER}
                  strokeWidth={9}
                  strokeLinecap="round"
                  opacity={0.75}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                />
              </svg>
              <span className="font-hand relative text-[1.9rem] font-bold leading-none text-pink-deep">{card.name}</span>
            </span>
          )}
          <Marker kind={doodles[2]} className={right ? "-left-12 bottom-0" : "-right-10 bottom-0"} size={40} delay={0.8} />
        </motion.div>
      )}
    </section>
  );
}

// ---------- раскладка фото одного друга ----------
function Layout({ tiles, right, seed }: { tiles: Tile[]; right: boolean; seed: string }) {
  const r = (k: string) => hash(seed + k);
  const tile = (x: Tile, cls: string, bleed: "left" | "right" | "none", k: number, alignRight = false) => (
    <Photo
      key={x.key}
      aspect={x.aspect}
      widthClass={cls}
      bleed={bleed}
      tilt={(r(`t${k}`) - 0.5) * 5}
      alignRight={alignRight}
      tapeSeed={seed + k}
      frame={x.el.kind === "frame"}
    >
      <TileContent el={x.el} />
    </Photo>
  );

  if (tiles.length === 1) return tile(tiles[0], "w-[82%]", right ? "right" : "left", 0, right);

  if (tiles.length === 2)
    return (
      <div className={cn("flex items-start gap-3", right && "flex-row-reverse")}>
        {tile(tiles[0], "w-[56%]", right ? "right" : "left", 0)}
        <div className="mt-10 w-[44%]">{tile(tiles[1], "w-full", "none", 1)}</div>
      </div>
    );

  // 3+: крупное фото на всю ширину (уходит за оба края), под ним остальные
  const rest = tiles.slice(1, 5);
  return (
    <div className="flex flex-col gap-4">
      {tile(tiles[0], "-mx-5 w-[calc(100%+2.5rem)]", "none", 0)}
      <div className={cn("flex items-start gap-3", right && "flex-row-reverse")}>
        {rest.map((x, k) => (
          <div key={x.key} className={cn("flex-1", k % 2 === 1 && "mt-8")}>
            {tile(x, "w-full", "none", k + 1)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TileContent({ el }: { el: CardElement }) {
  if (el.kind === "frame") return <CardElementView e={el} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mediaUrl(el.src)} alt="" draggable={false} className="size-full object-cover" loading="lazy" />;
}

// ---------- фото на синем скотче ----------
function Photo({
  children,
  aspect,
  widthClass,
  bleed,
  tilt,
  alignRight,
  tapeSeed,
  frame,
}: {
  children: React.ReactNode;
  aspect: number;
  widthClass: string;
  bleed: "left" | "right" | "none";
  tilt: number;
  alignRight?: boolean;
  tapeSeed: string;
  frame?: boolean;
}) {
  const tr = hash(tapeSeed + "tape");
  return (
    <motion.div
      className={cn("relative", widthClass, bleed === "left" && "-ml-9", bleed === "right" && "-mr-9", alignRight && "ml-auto")}
      style={{ rotate: `${tilt}deg` }}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ type: "spring", damping: 16, stiffness: 120 }}
    >
      <div
        className={cn("relative w-full", !frame && "overflow-hidden shadow-[0_8px_18px_-10px_rgba(40,30,60,.45)]")}
        style={{ aspectRatio: `1 / ${aspect}` }}
      >
        {children}
      </div>
      {/* синий скотч */}
      {!frame && (
        <motion.span
          className="absolute -top-3 h-6 w-20 origin-left bg-[#3552a8]/90"
          style={{ left: `${20 + tr * 45}%`, rotate: `${(tr - 0.5) * 10}deg`, clipPath: "polygon(2% 8%, 98% 0, 100% 92%, 0 100%)" }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}
