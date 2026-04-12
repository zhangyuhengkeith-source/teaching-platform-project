import Link from "next/link";
import { Compass } from "lucide-react";

export default function Custom404Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 text-slate-900">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-[0_18px_45px_-28px_rgba(15,23,42,0.25)]">
        <div className="mx-auto mb-6 inline-flex rounded-2xl bg-blue-50 p-4 text-[#1d4f91]">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The page you requested is not available in this teaching platform workspace, or the link may no longer be valid.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1d4f91] px-4 text-sm font-medium text-white transition hover:bg-[#173f74]"
            href="/"
          >
            Return home
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/classes"
          >
            Open classes
          </Link>
        </div>
      </div>
    </main>
  );
}

