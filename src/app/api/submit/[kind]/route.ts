import { NextResponse } from "next/server";
import { db, friendExists, ownsPath } from "@/lib/supabase-server";
import type { CardElement } from "@/lib/media";
import { isAssetId } from "@/content/assets";

// Приём контента от друзей. Каждый тип валидируем отдельно.
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export async function POST(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const body = await req.json().catch(() => null);
  const friendId = body?.friendId;
  if (!(await friendExists(friendId))) return NextResponse.json({ error: "friend" }, { status: 403 });

  let table: string;
  let row: Record<string, unknown>;

  switch (kind) {
    case "card": {
      const year = num(body.year, 2000, 2030, NaN);
      const raw: unknown[] = Array.isArray(body.elements) ? body.elements.slice(0, 30) : [];
      // Чистим элементы: оставляем только известные поля и допустимые значения
      const elements: CardElement[] = [];
      for (const e of raw as Partial<CardElement>[]) {
        if (!e || !["photo", "sticker", "asset", "frame"].includes(e.kind as string)) continue;
        if (e.kind === "photo" && !ownsPath(friendId, e.src)) continue;
        if (e.kind === "sticker" && !/^[a-z-]{1,30}$/.test(String(e.src))) continue;
        if (e.kind === "asset" && !isAssetId(e.src)) continue;
        if (e.kind === "frame" && (!isAssetId(e.src) || !ownsPath(friendId, e.photo))) continue;
        elements.push({
          id: str(e.id, 40) || crypto.randomUUID(),
          kind: e.kind as CardElement["kind"],
          src: String(e.src),
          ...(e.kind === "frame" ? { photo: e.photo } : {}),
          x: num(e.x, -0.5, 1.5, 0.5),
          y: num(e.y, -0.5, 1.5, 0.5),
          scale: num(e.scale, 0.15, 5, 1),
          rotation: num(e.rotation, -3600, 3600, 0),
          z: num(e.z, 0, 1000, 0),
          ...(e.kind === "photo" ? { aspect: num(e.aspect, 0.2, 5, 1) } : {}),
        });
      }
      if (!Number.isFinite(year) || elements.length === 0) {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      table = "timeline";
      row = { friend_id: friendId, year, story: str(body.story, 1000), elements };
      break;
    }

    case "audio": {
      if (!["diary", "call", "final"].includes(body.type) || !ownsPath(friendId, body.path)) {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      table = "audios";
      row = {
        friend_id: friendId,
        type: body.type,
        path: body.path,
        mime: str(body.mime, 60) || "audio/webm",
        duration_sec: num(body.duration, 0, 600, 0),
      };
      break;
    }

    case "video": {
      if (!ownsPath(friendId, body.path)) return NextResponse.json({ error: "invalid" }, { status: 400 });
      table = "videos";
      row = {
        friend_id: friendId,
        path: body.path,
        mime: str(body.mime, 60) || "video/mp4",
        duration_sec: num(body.duration, 0, 60, 0),
      };
      break;
    }

    case "quiz": {
      if (body.round === 1) {
        const fact = str(body.fact, 500);
        if (!fact) return NextResponse.json({ error: "invalid" }, { status: 400 });
        table = "quiz";
        row = { friend_id: friendId, round: 1, fact };
      } else {
        const question = str(body.question, 300);
        const correct = str(body.correct, 150);
        const wrong = Array.isArray(body.wrong) ? body.wrong.map((w: unknown) => str(w, 150)) : [];
        if (!question || !correct || wrong.length !== 3 || wrong.some((w: string) => !w)) {
          return NextResponse.json({ error: "invalid" }, { status: 400 });
        }
        table = "quiz";
        row = { friend_id: friendId, round: 2, question, correct, wrong };
      }
      break;
    }

    case "prediction": {
      const text = str(body.text, 1000);
      if (!text) return NextResponse.json({ error: "invalid" }, { status: 400 });
      table = "predictions";
      row = { friend_id: friendId, text };
      break;
    }

    default:
      return NextResponse.json({ error: "kind" }, { status: 404 });
  }

  const { error } = await db().from(table).insert(row);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
