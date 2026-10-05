"use client";

// Базовые кирпичики интерфейса в стиле shadcn/ui, подогнанные под розовую палитру
import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const cn = (...a: Parameters<typeof clsx>) => twMerge(clsx(...a));

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-bold transition active:scale-95 disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" && "bg-pink-deep text-white shadow-[0_6px_0_#c9688a] active:translate-y-0.5 active:shadow-[0_3px_0_#c9688a]",
        variant === "soft" && "bg-pink-soft text-rose-ink ring-2 ring-pink",
        variant === "ghost" && "text-rose-ink/80",
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-5 animate-spin" />}
      {children}
    </button>
  );
});

const field =
  "w-full rounded-2xl border-2 border-pink bg-white/80 px-4 py-3 text-base text-rose-ink placeholder:text-rose-ink/45 outline-none focus:border-pink-deep";

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(field, "min-h-28 resize-none", className)} {...rest} />;
  },
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(field, className)} {...rest} />;
  },
);

// Обёртка экрана формы: кнопка «назад» (только иконка) + заголовок
export function Screen({
  title,
  onBack,
  backLabel,
  children,
}: {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pb-10 pt-4"
    >
      {(onBack || title) && (
        <header className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label={backLabel}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80 ring-2 ring-pink active:scale-90"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          {title && <h2 className="font-display text-xl font-bold leading-tight">{title}</h2>}
        </header>
      )}
      {children}
    </motion.section>
  );
}

// Сообщение об ошибке/успехе под формой
export function Note({ tone, children }: { tone: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold",
        tone === "error" ? "bg-[#ffe1e1] text-[#a83a3a]" : "bg-[#e3f6e6] text-[#3b7a49]",
      )}
    >
      {children}
    </p>
  );
}

// Формат времени записи: 0:07
export const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
