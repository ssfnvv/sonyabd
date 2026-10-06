"use client";

// Частицы слетаются из темноты и складываются в имя. Палец/мышь мягко их разгоняет.
import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; r: number; c: string; tw: number };

const COLORS = ["#f9c5d5", "#fde4ec", "#fff3e3", "#f7a8c0", "#ffd9e6"];

export function ParticleName({ text, onFormed }: { text: string; onFormed?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const formedRef = useRef(onFormed);
  formedRef.current = onFormed;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let particles: P[] = [];
    let W = 0;
    let H = 0;
    const pointer = { x: -9999, y: -9999 };
    let start = performance.now();
    let formedFired = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Рисуем имя во внутреннем холсте и собираем точки, где есть буквы
    const sampleText = (): { x: number; y: number }[] => {
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d")!;
      let size = Math.min(W * 0.32, H * 0.3);
      o.font = `700 ${size}px Comfortaa, sans-serif`;
      // подгоняем размер под ширину экрана
      const maxW = W * 0.86;
      const w = o.measureText(text).width;
      if (w > maxW) {
        size *= maxW / w;
        o.font = `700 ${size}px Comfortaa, sans-serif`;
      }
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillText(text, W / 2, H * 0.42);
      const data = o.getImageData(0, 0, W, H).data;
      const step = Math.max(3, Math.round(size / 26));
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
        }
      }
      return pts;
    };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targets = sampleText();
      const old = particles;
      particles = targets.map((t, i) => {
        const prev = old[i];
        const a = Math.random() * Math.PI * 2;
        const d = Math.max(W, H) * (0.6 + Math.random() * 0.6);
        return {
          x: prev?.x ?? (reduced ? t.x : W / 2 + Math.cos(a) * d),
          y: prev?.y ?? (reduced ? t.y : H / 2 + Math.sin(a) * d),
          vx: 0,
          vy: 0,
          tx: t.x,
          ty: t.y,
          r: 0.8 + Math.random() * 1.6,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          tw: Math.random() * Math.PI * 2,
        };
      });
      // плюс немного свободно парящих «звёзд» на фоне
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        particles.push({ x, y, vx: 0, vy: 0, tx: NaN, ty: NaN, r: 0.5 + Math.random(), c: "#fde4ec", tw: Math.random() * 6 });
      }
    };

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      // частицы подтягиваются к своим местам постепенно: первые 2.5 секунды «сбор»
      const pull = Math.min(1, t / 2.5) * 0.045 + 0.005;

      for (const p of particles) {
        if (Number.isNaN(p.tx)) {
          // фоновые звёзды: медленный дрейф
          p.y -= 0.08;
          if (p.y < -5) p.y = H + 5;
        } else {
          // лёгкое «дыхание» на месте
          const ox = Math.sin(t * 1.3 + p.tw) * 0.8;
          const oy = Math.cos(t * 1.1 + p.tw) * 0.8;
          p.vx += (p.tx + ox - p.x) * pull;
          p.vy += (p.ty + oy - p.y) * pull;
          // отталкивание от пальца
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 6400) {
            const f = (1 - d2 / 6400) * 3;
            const d = Math.sqrt(d2) || 1;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
          p.vx *= 0.86;
          p.vy *= 0.86;
          p.x += p.vx;
          p.y += p.vy;
        }
        const alpha = 0.55 + Math.sin(t * 2 + p.tw) * 0.35;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!formedFired && t > 2.6) {
        formedFired = true;
        formedRef.current?.();
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    };

    // ждём шрифт, иначе буквы соберутся системным шрифтом
    document.fonts.load(`700 100px Comfortaa`).finally(() => {
      build();
      start = performance.now();
      raf = requestAnimationFrame(tick);
    });

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    window.addEventListener("pointerup", onLeave);
    window.addEventListener("pointercancel", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [text]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" aria-label={text} role="img" />;
}
