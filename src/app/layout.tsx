import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource/comfortaa/400.css";
import "@fontsource/comfortaa/700.css";
import "./globals.css";
import { Presence } from "@/components/Presence";

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
      <body className="min-h-dvh antialiased">
        {/* если после обновления сайта браузер держит старую версию и не может догрузить кусок кода —
            один раз перезагружаем страницу сами */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function h(m){if(!/Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(m||''))return;try{if(sessionStorage.getItem('reloaded'))return;sessionStorage.setItem('reloaded','1')}catch(e){}location.reload()}window.addEventListener('error',function(e){h(e&&(e.message||(e.error&&e.error.message)))});window.addEventListener('unhandledrejection',function(e){h(e&&e.reason&&(e.reason.message||String(e.reason)))});})();`,
          }}
        />
        <Presence />
        {children}
      </body>
    </html>
  );
}
