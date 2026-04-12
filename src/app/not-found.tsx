import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-white p-10 text-center shadow-panel">
        <div className="mx-auto mb-6 inline-flex rounded-2xl bg-blue-50 p-4 text-primary">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The page you requested is not available in this teaching platform workspace, or the link may no longer be valid.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/classes">Open classes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

