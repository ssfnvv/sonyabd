"use client";

// Отрисовка элементов карточки. Используется в редакторе, админке и акте 2.
import { baseWidth, CARD_ASPECT, elementAspect, mediaUrl, type CardElement } from "@/lib/media";
import { assetUnionWindow, assetUrl } from "@/content/assets";
import { StickerSvg } from "./stickers";
import { cn } from "./ui";

export function elementStyle(e: CardElement): React.CSSProperties {
  return {
    left: `${e.x * 100}%`,
    top: `${e.y * 100}%`,
    width: `${baseWidth(e) * e.scale * 100}%`,
    aspectRatio: `1 / ${elementAspect(e)}`,
    transform: `translate(-50%, -50%) rotate(${e.rotation}deg)`,
    zIndex: e.z,
  };
}

// photoSrc — локальное превью фото (пока файл ещё грузится), иначе берём из хранилища
export function CardElementView({ e, photoSrc }: { e: CardElement; photoSrc?: string }) {
  if (e.kind === "sticker") return <StickerSvg id={e.src} className="size-full drop-shadow-sm" />;

  if (e.kind === "asset") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={assetUrl(e.src)} alt="" draggable={false} className="size-full drop-shadow-[0_3px_4px_rgba(60,20,40,.18)]" />;
  }

  if (e.kind === "frame") {
    const [wx, wy, ww, wh] = assetUnionWindow(e.src);
    const src = photoSrc ?? (e.photo ? (e.photo.startsWith("data:") ? e.photo : mediaUrl(e.photo)) : undefined);
    return (
      <div className="relative size-full drop-shadow-[0_4px_6px_rgba(60,20,40,.22)]">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute object-cover"
            style={{ left: `${wx * 100}%`, top: `${wy * 100}%`, width: `${ww * 100}%`, height: `${wh * 100}%` }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(e.src)} alt="" draggable={false} className="absolute inset-0 size-full" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoSrc ?? mediaUrl(e.src)}
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
      <CardLayer elements={elements} />
    </div>
  );
}

// Только слой элементов, без фона — для акта 2, где фон карточки свой
export function CardLayer({ elements }: { elements: CardElement[] }) {
  return (
    <>
      {elements.map((e) => (
        <div key={e.id} className="absolute" style={elementStyle(e)}>
          <CardElementView e={e} />
        </div>
      ))}
    </>
  );
}
