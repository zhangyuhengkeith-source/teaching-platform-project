import type { ReactNode } from "react";
import type { Metadata } from "next";

import "@/styles/globals.css";
import { I18nProvider } from "@/providers/i18n-provider";

export const metadata: Metadata = {
  title: "Teaching Platform MVP",
  description: "Production-oriented foundation for a personal teaching platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
