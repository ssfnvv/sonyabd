"use client";

// Акт 2: один большой постер в серебряной рамке (сам постер — в components/acts/Poster).
import { useEffect, useState } from "react";
import Link from "next/link";
import { copy } from "@/content/copy";
import { ActShell } from "@/components/acts/ActShell";
import { PeekCat } from "@/components/acts/PeekCat";
import { Poster, type Card } from "@/components/acts/Poster";

const t = copy.act2;

export default function Act2() {
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    fetch("/api/public/timeline")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  return (
    <ActShell back="/act1" className="scrap-desk">
      <PeekCat cat="cat-glasses" edge="bottom-right" size={110} delay={2.5} />
      <div className="mx-auto flex max-w-xl flex-col items-center px-3 pb-24 pt-20">
        {cards === null && <div className="mt-40 size-10 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />}

        {cards !== null && cards.length > 0 && <Poster cards={cards} />}

        {cards !== null && (
          <Link
            href="/act3"
            className="mt-10 inline-block rounded-full bg-pink-deep px-12 py-4 font-display text-lg font-bold text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]"
          >
            {t.next}
          </Link>
        )}
      </div>
    </ActShell>
  );
}

