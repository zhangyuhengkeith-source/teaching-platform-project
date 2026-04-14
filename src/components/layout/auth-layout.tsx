import type { ReactNode } from "react";

import { TranslationText } from "@/components/common/translation-text";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container-shell flex min-h-[calc(100vh-4rem)] items-center py-8 sm:py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden rounded-[2rem] border border-border bg-slate-900 px-10 py-12 text-slate-100 shadow-panel lg:block">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">YIA Andy Zhang Studio</p>
          <div className="mt-6 space-y-4">
            <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">{title}</h1>
            {description ? <p className="max-w-lg text-sm leading-7 text-slate-300">{description}</p> : null}
          </div>
          <div className="mt-8 space-y-4 text-sm text-slate-300">
            <p><TranslationText translationKey="auth.panelDescription1" /></p>
            <p><TranslationText translationKey="auth.panelDescription2" /></p>
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-6 space-y-2 lg:hidden">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">YIA Andy Zhang Studio</p>
              <h1 className="text-3xl font-semibold">{title}</h1>
              {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
