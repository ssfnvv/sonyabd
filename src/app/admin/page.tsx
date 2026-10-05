"use client";

// Админка владелицы: весь контент друзей, пометка «новое», скрыть/вернуть, удалить.
import { useCallback, useEffect, useMemo, useState } from "react";
import { copy } from "@/content/copy";
import { mediaUrl, type CardElement } from "@/lib/media";
import { CardView } from "@/components/CardView";
import { Button, Input, Note, cn } from "@/components/ui";

const a = copy.admin;
const s = copy.contribute.sections;

type Base = { id: string; created_at: string; reviewed: boolean; hidden: boolean; friends: { name: string } | null };
type Row = Base & Record<string, unknown>;
type Table = "timeline" | "audios" | "quiz" | "predictions" | "videos";
type Data = Record<Table, Row[]>;

const TABS: { id: Table; label: string }[] = [
  { id: "timeline", label: s.card },
  { id: "audios", label: s.voice },
  { id: "quiz", label: s.quiz },
  { id: "predictions", label: s.prediction },
  { id: "videos", label: s.video },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Table>("timeline");
  const [onlyNew, setOnlyNew] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/items", { cache: "no-store" });
    if (res.status === 401) return setAuthed(false);
    setAuthed(true);
    setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (table: Table, id: string, p: { reviewed?: boolean; hidden?: boolean }) => {
    // оптимистично обновляем экран, потом сервер
    setData((d) => d && { ...d, [table]: d[table].map((r) => (r.id === id ? { ...r, ...p } : r)) });
    await fetch("/api/admin/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, ...p }),
    });
  };

  const remove = async (table: Table, id: string) => {
    if (!confirm(a.confirmRemove)) return;
    setData((d) => d && { ...d, [table]: d[table].filter((r) => r.id !== id) });
    await fetch("/api/admin/item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id }),
    });
  };

  const friendsCount = useMemo(() => {
    if (!data) return 0;
    const names = new Set<string>();
    Object.values(data).forEach((rows) => rows.forEach((r) => r.friends && names.add(r.friends.name)));
    return names.size;
  }, [data]);

  if (authed === null) return <main className="min-h-dvh bg-cream" />;
  if (!authed) return <Login onOk={load} />;
  if (!data) return null;

  const rows = data[tab].filter((r) => !onlyNew || !r.reviewed);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 bg-cream px-4 py-6">
      <p className="text-sm font-semibold text-rose-ink/70">
        {a.friendsCount}: {friendsCount}
      </p>

      {/* Вкладки с количеством новых */}
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(({ id, label }) => {
          const fresh = data[id].filter((r) => !r.reviewed).length;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-bold ring-2",
                tab === id ? "bg-pink-deep text-white ring-pink-deep" : "bg-white ring-pink",
              )}
            >
              {label}
              <span className="text-xs opacity-70">{data[id].length}</span>
              {fresh > 0 && (
                <span className="rounded-full bg-[#ff5c8a] px-2 text-xs text-white">{fresh}</span>
              )}
            </button>
          );
        })}
      </nav>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="size-4 accent-[#e88aa8]" />
        {a.onlyNew}
      </label>

      {rows.length === 0 && <p className="py-10 text-center text-rose-ink/50">{a.empty}</p>}

      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <article
            key={r.id}
            className={cn(
              "flex flex-col gap-3 rounded-3xl bg-white p-4 ring-2",
              r.reviewed ? "ring-pink-soft" : "ring-[#ff5c8a]",
              r.hidden && "opacity-50",
            )}
          >
            <header className="flex flex-wrap items-center gap-2 text-sm">
              <b className="text-base">{r.friends?.name ?? "?"}</b>
              <span className="text-rose-ink/50">
                {new Date(r.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              {!r.reviewed && <span className="rounded-full bg-[#ff5c8a] px-2 py-0.5 text-xs font-bold text-white">{a.newBadge}</span>}
              {r.hidden && <span className="rounded-full bg-rose-ink px-2 py-0.5 text-xs font-bold text-white">{a.hiddenBadge}</span>}
            </header>

            <ItemBody table={tab} r={r} />

            <footer className="flex flex-wrap gap-2">
              {!r.reviewed && (
                <Button className="min-h-10 px-4 text-sm" onClick={() => patch(tab, r.id, { reviewed: true })}>
                  {a.markReviewed}
                </Button>
              )}
              <Button variant="soft" className="min-h-10 px-4 text-sm" onClick={() => patch(tab, r.id, { hidden: !r.hidden, reviewed: true })}>
                {r.hidden ? a.show : a.hide}
              </Button>
              <Button variant="ghost" className="min-h-10 px-4 text-sm text-[#a83a3a]" onClick={() => remove(tab, r.id)}>
                {a.remove}
              </Button>
            </footer>
          </article>
        ))}
      </div>
    </main>
  );
}

function ItemBody({ table, r }: { table: Table; r: Row }) {
  switch (table) {
    case "timeline":
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <CardView elements={r.elements as CardElement[]} className="max-w-72" />
          <div className="flex flex-col gap-1">
            <b className="font-display text-2xl">{r.year as number}</b>
            <p className="whitespace-pre-wrap">{r.story as string}</p>
          </div>
        </div>
      );
    case "audios":
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">{a.audioTypes[r.type as "diary" | "call" | "final"]}</span>
          <audio controls preload="none" src={mediaUrl(r.path as string)} className="w-full" />
        </div>
      );
    case "videos":
      return <video controls preload="metadata" playsInline src={mediaUrl(r.path as string)} className="max-h-80 w-full rounded-2xl bg-black" />;
    case "predictions":
      return <p className="whitespace-pre-wrap">{r.text as string}</p>;
    case "quiz":
      return r.round === 1 ? (
        <div>
          <span className="text-sm font-bold">{a.round1}</span>
          <p className="whitespace-pre-wrap">{r.fact as string}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">{a.round2}</span>
          <p className="font-semibold">{r.question as string}</p>
          <p className="text-[#3b7a49]">+ {r.correct as string}</p>
          {(r.wrong as string[]).map((w, i) => (
            <p key={i} className="text-rose-ink/60">– {w}</p>
          ))}
        </div>
      );
  }
}

function Login({ onOk }: { onOk: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) onOk();
    else setError(true);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-6">
      <form onSubmit={go} className="flex w-full max-w-xs flex-col gap-3">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={a.passwordPlaceholder} autoFocus />
        {error && <Note tone="error">{a.wrongPassword}</Note>}
        <Button type="submit" loading={busy}>
          {a.enter}
        </Button>
      </form>
    </main>
  );
}
