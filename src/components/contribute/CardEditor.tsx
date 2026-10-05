"use client";

// Редактор карточки «как в Toca Boca»: добавляешь фото и стикеры,
// таскаешь одним пальцем, двумя — масштабируешь и поворачиваешь.
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { copy } from "@/content/copy";
import { CARD_ASPECT, TIMELINE_YEARS, type CardElement } from "@/lib/media";
import { compressImage } from "@/lib/image";
import { submit, uploadFile, type Friend } from "@/lib/client-api";
import { STICKERS, StickerSvg } from "../stickers";
import { CardElementView, elementStyle } from "../CardView";
import { Button, Note, Screen, TextArea, cn } from "../ui";

const t = copy.contribute;

type EditorElement = CardElement & { localUrl?: string; uploading?: boolean };

type Pt = { x: number; y: number };
type Baseline = {
  id: string;
  el: Pick<CardElement, "x" | "y" | "scale" | "rotation">;
  centroid: Pt;
  dist: number;
  angle: number;
};

const centroidOf = (pts: Pt[]) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});
const distOf = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const angleOf = (a: Pt, b: Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function CardEditor({ friend, onBack, onDone }: { friend: Friend; onBack: () => void; onDone: () => void }) {
  const [year, setYear] = useState<number | null>(null);
  const [story, setStory] = useState("");
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const pointers = useRef(new Map<number, Pt>());
  const baseline = useRef<Baseline | null>(null);

  // Освобождаем локальные превью фото при уходе со страницы
  useEffect(
    () => () => elementsRef.current.forEach((e) => e.localUrl && URL.revokeObjectURL(e.localUrl)),
    [],
  );

  const maxZ = () => elementsRef.current.reduce((m, e) => Math.max(m, e.z), 0);

  const update = useCallback((id: string, patch: Partial<EditorElement>) => {
    setElements((els) => els.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  // Добавить элемент в центр холста с небольшим случайным сдвигом и наклоном
  const addElement = (el: Omit<EditorElement, "x" | "y" | "rotation" | "z" | "scale">) => {
    const next: EditorElement = {
      ...el,
      x: 0.5 + (Math.random() - 0.5) * 0.2,
      y: 0.45 + (Math.random() - 0.5) * 0.2,
      rotation: (Math.random() - 0.5) * 16,
      scale: 1,
      z: maxZ() + 1,
    };
    setElements((els) => [...els, next]);
    setSelected(next.id);
    setError(null);
  };

  // ---------- фото ----------
  const onPickPhotos = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files).slice(0, 5)) {
      const id = crypto.randomUUID();
      try {
        const { blob, aspect } = await compressImage(file);
        const localUrl = URL.createObjectURL(blob);
        addElement({ id, kind: "photo", src: "", localUrl, aspect, uploading: true });
        uploadFile(friend.id, "photo", blob, "jpg")
          .then((path) => update(id, { src: path, uploading: false }))
          .catch(() => {
            setElements((els) => els.filter((e) => e.id !== id));
            setError(t.uploadError);
          });
      } catch {
        setError(t.uploadError);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  // ---------- жесты ----------
  const resetBaseline = () => {
    const id = baseline.current?.id ?? selected;
    const el = elementsRef.current.find((e) => e.id === id);
    const pts = [...pointers.current.values()];
    if (!el || pts.length === 0) {
      baseline.current = null;
      return;
    }
    baseline.current = {
      id: el.id,
      el: { x: el.x, y: el.y, scale: el.scale, rotation: el.rotation },
      centroid: centroidOf(pts),
      dist: pts.length > 1 ? distOf(pts[0], pts[1]) : 0,
      angle: pts.length > 1 ? angleOf(pts[0], pts[1]) : 0,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (pointers.current.size === 0) {
      // первый палец решает, какой элемент двигаем
      const hit = (e.target as HTMLElement).closest<HTMLElement>("[data-el]")?.dataset.el;
      if (!hit) {
        setSelected(null);
        return;
      }
      setSelected(hit);
      update(hit, { z: maxZ() + 1 });
      baseline.current = { id: hit } as Baseline;
    } else if (!baseline.current) {
      return;
    }
    canvasRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    resetBaseline();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !baseline.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const rect = canvasRef.current!.getBoundingClientRect();
    const pts = [...pointers.current.values()];
    const b = baseline.current;
    const c = centroidOf(pts);

    const patch: Partial<CardElement> = {
      x: clamp(b.el.x + (c.x - b.centroid.x) / rect.width, -0.2, 1.2),
      y: clamp(b.el.y + (c.y - b.centroid.y) / rect.height, -0.2, 1.2),
    };
    if (pts.length > 1 && b.dist > 0) {
      patch.scale = clamp((b.el.scale * distOf(pts[0], pts[1])) / b.dist, 0.25, 4);
      patch.rotation = b.el.rotation + angleOf(pts[0], pts[1]) - b.angle;
    }
    update(b.id, patch);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) baseline.current = null;
    else resetBaseline();
  };

  // Колёсико мыши масштабирует (удобно для тебя при проверке с ноутбука)
  const onWheel = (e: React.WheelEvent) => {
    if (!selected) return;
    const el = elements.find((x) => x.id === selected);
    if (el) update(selected, { scale: clamp(el.scale * (e.deltaY < 0 ? 1.08 : 0.93), 0.25, 4) });
  };

  const removeSelected = () => {
    const el = elements.find((e) => e.id === selected);
    if (el?.localUrl) URL.revokeObjectURL(el.localUrl);
    setElements((els) => els.filter((e) => e.id !== selected));
    setSelected(null);
  };

  // ---------- сохранение ----------
  const uploading = elements.some((e) => e.uploading);

  const save = async () => {
    setError(null);
    if (!year) return setError(t.fillAllFields);
    if (elements.length === 0) return setError(t.cardEmpty);
    setSaving(true);
    try {
      await submit("card", {
        friendId: friend.id,
        year,
        story,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        elements: elements.map(({ localUrl, uploading, ...rest }) => rest),
      });
      onDone();
    } catch {
      setError(t.uploadError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={t.sections.card} onBack={onBack} backLabel={t.back}>
      {/* Год */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{t.yearHint}</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {TIMELINE_YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 font-bold ring-2 transition",
                y === year ? "bg-pink-deep text-white ring-pink-deep" : "bg-white/80 ring-pink",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Холст */}
      <div
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl bg-white ring-2 ring-pink"
        style={{
          aspectRatio: `1 / ${CARD_ASPECT}`,
          backgroundImage: "radial-gradient(var(--pink-soft) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      >
        {elements.map((e) => (
          <div
            key={e.id}
            data-el={e.id}
            className={cn(
              "absolute cursor-grab",
              selected === e.id && "outline-2 outline-offset-4 outline-dashed outline-pink-deep rounded-md",
            )}
            style={elementStyle(e)}
          >
            <CardElementView e={e} src={e.localUrl} />
            {e.uploading && (
              <div className="absolute inset-0 grid place-items-center rounded-md bg-white/50">
                <span className="size-6 animate-spin rounded-full border-4 border-pink border-t-pink-deep" />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="-mt-3 text-center text-xs text-rose-ink/60">{t.gestureHint}</p>

      {/* Панель инструментов */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="soft" className="px-2" onClick={() => fileRef.current?.click()}>
          {t.cardButtons.photo}
        </Button>
        <Button variant="soft" className="px-2" onClick={() => setSheetOpen(true)}>
          {t.cardButtons.stickers}
        </Button>
        <Button variant="soft" className="px-2" disabled={!selected} onClick={removeSelected}>
          {t.cardButtons.remove}
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onPickPhotos(e.target.files)} />

      <TextArea
        value={story}
        maxLength={1000}
        onChange={(e) => setStory(e.target.value)}
        placeholder={t.storyPlaceholder}
      />

      {error && <Note tone="error">{error}</Note>}
      <Button onClick={save} loading={saving || uploading}>
        {t.cardButtons.save}
      </Button>

      {/* Всплывающее меню стикеров */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-rose-ink/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-[2rem] bg-cream p-5 pb-8 shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-pink" />
              <div className="grid grid-cols-4 gap-3">
                {STICKERS.map((s) => (
                  <button
                    key={s.id}
                    className="aspect-square rounded-2xl bg-white p-2 ring-2 ring-pink-soft active:scale-90"
                    onClick={() => {
                      addElement({ id: crypto.randomUUID(), kind: "sticker", src: s.id });
                      setSheetOpen(false);
                    }}
                  >
                    <StickerSvg id={s.id} className="size-full" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Screen>
  );
}
