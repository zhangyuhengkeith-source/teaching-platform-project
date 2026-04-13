import type { ReactNode } from "react";

import { TranslationText } from "@/components/common/translation-text";
import { TopNav } from "@/components/layout/top-nav";
import { PUBLIC_NAV } from "@/lib/constants/nav";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav items={PUBLIC_NAV} title="YIA Andy Zhang Studio" />
      <main>{children}</main>
      <footer className="border-t border-border bg-white/80">
        <div className="container-shell flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p><TranslationText translationKey="layout.publicFooterPrimary" /></p>
          <p><TranslationText translationKey="layout.publicFooterSecondary" /></p>
        </div>
      </footer>
    </div>
  );
}
