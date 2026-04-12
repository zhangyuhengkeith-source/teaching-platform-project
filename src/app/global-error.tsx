"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-white p-10 text-center shadow-panel">
            <div className="mx-auto mb-6 inline-flex rounded-2xl bg-amber-50 p-4 text-amber-700">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">500</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">This page could not load</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A server error interrupted the request. You can retry the page now or return to a stable part of the platform.
            </p>
            {error.digest ? <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p> : null}
            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={reset} type="button">
                Try again
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
