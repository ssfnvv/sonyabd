"use client";

// Пульт владелицы: кто сейчас на сайте, сколько чего прислали, и весь контент
// с модерацией (пометка «новое», скрыть/вернуть, удалить).
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, EyeOff, Eye, Trash2, Image as ImageIcon, Mic, HelpCircle, Mail, Video } from "lucide-react";
import "@fontsource/caveat/cyrillic-700.css";
import "@fontsource/caveat/latin-700.css";
import { copy } from "@/content/copy";
import { mediaUrl, type CardElement } from "@/lib/media";
import { assetThumbUrl } from "@/content/assets";
import { CardView } from "@/components/CardView";
import { Doodles } from "@/components/acts/Doodles";
import { RansomText } from "@/components/acts/RansomText";
import { Button, Input, Note, cn } from "@/components/ui";

const a = copy.admin;
const s = copy.contribute.sections;

type Base = { id: string; created_at: string; reviewed: boolean; hidden: boolean; friends: { name: string } | null };
type Row = Base & Record<string, unknown>;
type Table = "timeline" | "audios" | "quiz" | "predictions" | "videos";
type Data = Record<Table, Row[]>;
type Online = { session_id: string; name: string | null; path: string; last_seen: string };

const TABS: { id: Table; label: string; Icon: typeof Mic; cat: string; tint: string }[] = [
  { id: "timeline", label: s.card, Icon: ImageIcon, cat: "cat-calico", tint: "#fde4ec" },
  { id: "audios", label: s.voice, Icon: Mic, cat: "cat-glasses", tint: "#fff0dc" },
  { id: "quiz", label: s.quiz, Icon: HelpCircle, cat: "cat-shock", tint: "#e6f0fb" },
  { id: "predictions", label: s.prediction, Icon: Mail, cat: "cat-cupcake", tint: "#f1e6fb" },
  { id: "videos", label: s.video, Icon: Video, cat: "cat-wink", tint: "#e3f4e8" },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Table>("timeline");
  const [onlyNew, setOnlyNew] = useState(false);
  const [online, setOnline] = useState<Online[] | null>(null);
  const [presenceMissing, setPresenceMissing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/items", { cache: "no-store" });
    if (res.status === 401) return setAuthed(false);
    setAuthed(true);
    setData(await res.json());
  }, []);

  const loadOnline = useCallback(async () => {
    const res = await fetch("/api/admin/presence", { cache: "no-store" });
    if (!res.ok) return;
    const j = await res.json();
    if (j.error === "no_table") setPresenceMissing(true);
    else setOnline(j.online);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // «кто на сайте» обновляется каждые 10 секунд, контент — каждую минуту
  useEffect(() => {
    if (!authed) return;
    loadOnline();
    const a1 = setInterval(loadOnline, 10_000);
    const a2 = setInterval(load, 60_000);
    return () => {
      clearInterval(a1);
      clearInterval(a2);
    };
  }, [authed, load, loadOnline]);

  const patch = async (table: Table, id: string, p: { reviewed?: boolean; hidden?: boolean }) => {
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
    Object.values(data).forEach((rows) => rows.forEach((r) => r.friends && names.add(r.friends.name.trim().toLowerCase())));
    return names.size;
  }, [data]);

  if (authed === null) return <main className="bg-dreamy min-h-dvh" />;
  if (!authed) return <Login onOk={load} />;
  if (!data) return <main className="bg-dreamy min-h-dvh" />;

  const rows = data[tab].filter((r) => !onlyNew || !r.reviewed);
  const named = (online ?? []).filter((o) => o.name);
  const anon = (online ?? []).filter((o) => !o.name);
  const anonForm = anon.filter((o) => o.path.startsWith("/contribute")).length;
  const anonGift = anon.length - anonForm;

  return (
    <main className="bg-dreamy relative min-h-dvh">
      <Doodles seed="admin" count={12} kinds={["heart", "star", "sparkle", "flower", "swirl"]} />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
        <header className="flex flex-col items-start gap-3">
          <RansomText text={a.title} size={30} />
          <span className="rounded-full bg-white/80 px-4 py-1 text-sm font-semibold ring-2 ring-pink-soft">
            {a.friendsCount}: <b className="font-hand text-xl text-pink-deep">{friendsCount}</b>
          </span>
        </header>

        {/* ---------- кто сейчас на сайте ---------- */}
        <section className="relative overflow-visible rounded-[2rem] bg-white/85 p-5 shadow-[0_10px_30px_-16px_#c9688a] ring-2 ring-pink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetThumbUrl("cat-lick")} alt="" className="pointer-events-none absolute -right-3 -top-10 h-20 w-auto rotate-6" />
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5ad17d] opacity-70" />
              <span className="relative inline-flex size-3 rounded-full bg-[#3fbf64]" />
            </span>
            {a.onlineNow}
            {online && <span className="font-hand text-2xl text-pink-deep">{online.length}</span>}
          </h2>

          {presenceMissing ? (
            <p className="text-sm text-rose-ink/70">{a.presenceSetup}</p>
          ) : online && online.length === 0 ? (
            <p className="font-hand text-xl text-rose-ink/60">{a.onlineNobody}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {named.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {named.map((o) => (
                      <motion.span
                        key={o.session_id}
                        layout
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="flex items-center gap-2 rounded-full bg-pink-soft py-1 pl-1 pr-3 ring-2 ring-pink"
                      >
                        <span className="grid size-7 place-items-center rounded-full bg-pink-deep font-display text-sm font-bold text-white">
                          {o.name!.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold">{o.name}</span>
                        <span className="text-xs text-rose-ink/60">· {o.path.startsWith("/contribute") ? a.where.contribute : a.where.gift}</span>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-2xl bg-[#fff0dc] px-3 py-2 font-semibold">
                  <b className="font-hand text-2xl text-rose-ink">{anonForm}</b> {a.anonForm}
                </span>
                <span className="rounded-2xl bg-[#f1e6fb] px-3 py-2 font-semibold">
                  <b className="font-hand text-2xl text-rose-ink">{anonGift}</b> {a.anonGift}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ---------- плитки-счётчики = вкладки ---------- */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pt-6 [scrollbar-width:none]">
          {TABS.map(({ id, label, Icon, cat, tint }) => {
            const fresh = data[id].filter((r) => !r.reviewed).length;
            const active = tab === id;
            return (
              <motion.button
                key={id}
                onClick={() => setTab(id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex w-36 shrink-0 flex-col items-start gap-1 rounded-[1.5rem] p-4 text-left ring-2 transition-shadow",
                  active ? "ring-pink-deep shadow-[0_8px_20px_-10px_#c9688a]" : "ring-pink/70",
                )}
                style={{ background: tint }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetThumbUrl(cat)} alt="" className="pointer-events-none absolute -right-2 -top-7 h-14 w-auto rotate-6" />
                <Icon className="size-5 text-rose-ink/70" />
                <span className="font-hand text-4xl font-bold leading-none">{data[id].length}</span>
                <span className="text-sm font-bold leading-tight">{label}</span>
                {fresh > 0 && (
                  <span className="absolute -left-2 -top-2 rounded-full bg-[#ff5c8a] px-2 py-0.5 text-xs font-bold text-white shadow">
                    +{fresh}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <label className="flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold ring-2 ring-pink-soft">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="size-4 accent-[#e88aa8]" />
          {a.onlyNew}
        </label>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetThumbUrl("cat-orange")} alt="" className="h-24 w-auto opacity-80" />
            <p className="font-hand text-2xl text-rose-ink/60">{a.empty}</p>
          </div>
        )}

        {/* ---------- записи ---------- */}
        <div className="grid gap-5 sm:grid-cols-2">
          <AnimatePresence>
            {rows.map((r, i) => (
              <motion.article
                key={r.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: r.hidden ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "relative flex flex-col gap-3 rounded-[1.5rem] bg-white p-4 shadow-[0_10px_24px_-16px_#7a3b52]",
                  r.reviewed ? "ring-2 ring-pink-soft" : "ring-2 ring-[#ff5c8a]",
                )}
                style={{ rotate: `${(i % 2 ? 1 : -1) * 0.6}deg` }}
              >
                {/* скотч сверху */}
                <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] bg-[#f6d9a8]/80" />
                <header className="flex flex-wrap items-center gap-2 text-sm">
                  <b className="font-hand text-2xl leading-none">{r.friends?.name ?? "?"}</b>
                  <span className="text-rose-ink/50">
                    {new Date(r.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {!r.reviewed && <span className="rounded-full bg-[#ff5c8a] px-2 py-0.5 text-xs font-bold text-white">{a.newBadge}</span>}
                  {r.hidden && <span className="rounded-full bg-rose-ink px-2 py-0.5 text-xs font-bold text-white">{a.hiddenBadge}</span>}
                </header>

                <ItemBody table={tab} r={r} />

                <footer className="mt-auto flex flex-wrap gap-2">
                  {!r.reviewed && (
                    <Button className="min-h-10 px-4 text-sm" onClick={() => patch(tab, r.id, { reviewed: true })}>
                      <Check className="size-4" />
                      {a.markReviewed}
                    </Button>
                  )}
                  <Button variant="soft" className="min-h-10 px-4 text-sm" onClick={() => patch(tab, r.id, { hidden: !r.hidden, reviewed: true })}>
                    {r.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    {r.hidden ? a.show : a.hide}
                  </Button>
                  <Button variant="ghost" className="min-h-10 px-3 text-sm text-[#a83a3a]" onClick={() => remove(tab, r.id)} aria-label={a.remove}>
                    <Trash2 className="size-4" />
                  </Button>
                </footer>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function ItemBody({ table, r }: { table: Table; r: Row }) {
  switch (table) {
    case "timeline":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <RansomText text={String(r.year)} size={22} />
          </div>
          <CardView elements={r.elements as CardElement[]} className="rounded-xl" />
          {(r.story as string) && <p className="font-hand whitespace-pre-wrap text-xl leading-tight">{r.story as string}</p>}
        </div>
      );
    case "audios":
      return (
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-[#fff0dc] px-3 py-1 text-xs font-bold">{a.audioTypes[r.type as "diary" | "call" | "final"]}</span>
          <audio controls preload="none" src={mediaUrl(r.path as string)} className="w-full" />
        </div>
      );
    case "videos":
      return <video controls preload="metadata" playsInline src={mediaUrl(r.path as string)} className="max-h-80 w-full rounded-2xl bg-black" />;
    case "predictions":
      return <p className="font-hand whitespace-pre-wrap rounded-xl bg-[#fffdf6] p-3 text-2xl leading-tight">{r.text as string}</p>;
    case "quiz":
      return r.round === 1 ? (
        <div className="flex flex-col gap-1">
          <span className="w-fit rounded-full bg-[#e6f0fb] px-3 py-1 text-xs font-bold">{a.round1}</span>
          <p className="font-hand whitespace-pre-wrap text-2xl leading-tight">{r.fact as string}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="w-fit rounded-full bg-[#e6f0fb] px-3 py-1 text-xs font-bold">{a.round2}</span>
          <p className="font-semibold">{r.question as string}</p>
          <p className="text-[#3b7a49]">✓ {r.correct as string}</p>
          {(r.wrong as string[]).map((w, i) => (
            <p key={i} className="text-rose-ink/60">✗ {w}</p>
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
    <main className="bg-dreamy grid min-h-dvh place-items-center px-6">
      <form onSubmit={go} className="relative flex w-full max-w-xs flex-col gap-3 rounded-[2rem] bg-white/85 p-6 pt-10 ring-2 ring-pink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetThumbUrl("cat-glasses")} alt="" className="absolute -top-12 left-1/2 h-20 w-auto -translate-x-1/2" />
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={a.passwordPlaceholder} autoFocus />
        {error && <Note tone="error">{a.wrongPassword}</Note>}
        <Button type="submit" loading={busy}>
          {a.enter}
        </Button>
      </form>
    </main>
  );
}
