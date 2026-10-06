import type { NextConfig } from "next";

// Из России *.supabase.co может не открываться (блокировки). Поэтому браузер ходит в Supabase
// через наш же домен: /sb/... → https://<проект>.supabase.co/... (Vercel проксирует запрос).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!supabaseUrl) return [];
    return [{ source: "/sb/:path*", destination: `${supabaseUrl}/:path*` }];
  },
};

export default nextConfig;
