"use client";

// Метка «демо» в правом верхнем углу — видна только в демо-режиме
import { useEffect, useState } from "react";
import { copy } from "@/content/copy";
import { isDemo } from "@/lib/demo";

export function DemoBadge() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isDemo());
  }, []);
  if (!on) return null;
  return (
    <span className="pointer-events-none fixed right-4 top-5 z-50 rotate-[4deg] rounded-md bg-[#ffe45c] px-3 py-1 font-display text-sm font-bold uppercase tracking-widest text-[#4a2a36] shadow-[0_3px_0_#d4b830]">
      {copy.demo.badge}
    </span>
  );
}
