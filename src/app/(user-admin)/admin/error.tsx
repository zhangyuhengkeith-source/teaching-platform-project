"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UserAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-8 shadow-panel">
      <div className="mb-4 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-700">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">Admin page failed to load</h2>
      <p className="mt-3 text-sm text-slate-600">
        {error.message || "Unknown error."}
      </p>
      {error.digest ? <p className="mt-2 text-xs text-slate-400">Digest: {error.digest}</p> : null}
      <Button className="mt-6" onClick={reset} type="button">
        Retry
      </Button>
    </div>
  );
}
