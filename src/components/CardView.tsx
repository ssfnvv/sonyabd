"use client";

// Отрисовка карточки только для просмотра — используется в админке и в акте 2 (таймлайн).
import { BASE_WIDTH, CARD_ASPECT, mediaUrl, type CardElement } from "@/lib/media";
import { StickerSvg } from "./stickers";
import { cn } from "./ui";

export function elementStyle(e: CardElement): React.CSSProperties {
  return {
    left: `${e.x * 100}%`,
    top: `${e.y * 100}%`,
    width: `${BASE_WIDTH[e.kind] * e.scale * 100}%`,
    aspectRatio: e.kind === "photo" ? `1 / ${e.aspect ?? 1}` : "1 / 1",
    transform: `translate(-50%, -50%) rotate(${e.rotation}deg)`,
    zIndex: e.z,
  };
}

export function CardElementView({ e, src }: { e: CardElement; src?: string }) {
  if (e.kind === "sticker") return <StickerSvg id={e.src} className="size-full drop-shadow-sm" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? mediaUrl(e.src)}
      alt=""
      draggable={false}
      className="size-full rounded-md border-[6px] border-white object-cover shadow-md"
    />
  );
}

export function CardView({ elements, className }: { elements: CardElement[]; className?: string }) {
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-3xl bg-cream ring-2 ring-pink", className)}
      style={{ aspectRatio: `1 / ${CARD_ASPECT}` }}
    >
      {elements.map((e) => (
        <div key={e.id} className="absolute" style={elementStyle(e)}>
          <CardElementView e={e} />
        </div>
      ))}
    </div>
  );
}
