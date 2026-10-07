// Особые видео, которые лежат прямо на сайте (в /public/special), а не в базе.
// Показываются последними в трейлере (акт 6) и в архиве.
export type SpecialVideo = { id: string; src: string; name: string };

export const SPECIAL_VIDEOS: SpecialVideo[] = [
  // видео лучшей подруги (≈38 с, вертикальное), в трейлере — в розовой рамке-полароиде
  { id: "special-vika", src: "/special/vika.mp4", name: "Вика" },
];
