"use client";

// Сжимаем фото с телефона: до 1600px по длинной стороне, JPEG 85%.
// Фото с iPhone весят 3–8 МБ, после сжатия — 200–500 КБ.
export async function compressImage(
  file: File,
  maxSide = 1600,
): Promise<{ blob: Blob; aspect: number }> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // запасной путь для старых браузеров
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const w = source.width;
  const h = source.height;
  const k = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
  );
  return { blob, aspect: h / w };
}
