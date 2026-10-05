import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource/comfortaa/400.css";
import "@fontsource/comfortaa/700.css";
import "./globals.css";

// Заголовок вкладки браузера — без лишних слов, чтобы ссылка не спалила сюрприз
export const metadata: Metadata = {
  title: "Соня",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // запрещаем зум браузера: в редакторе карточки щипок масштабирует элементы
  themeColor: "#fde4ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
