import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="container-shell flex min-h-[calc(100vh-4rem)] items-center py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[2rem] border border-border bg-slate-900 px-10 py-12 text-slate-100 shadow-panel lg:block">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Professor Lin Studio</p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight text-white">{title}</h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">{description}</p>
          <div className="mt-10 space-y-4 text-sm text-slate-300">
            <p>Designed for calm academic workflows, personal feedback, and long-term student growth.</p>
            <p>Supabase auth helpers are wired in now so profile bootstrap and role routing can be added without reworking page code later.</p>
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8 space-y-2 lg:hidden">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Professor Lin Studio</p>
              <h1 className="text-3xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

