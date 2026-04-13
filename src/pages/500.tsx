"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { useI18n } from "@/hooks/use-i18n";
import { I18nProvider } from "@/providers/i18n-provider";

function Custom500Content() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 text-slate-900">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-[0_18px_45px_-28px_rgba(15,23,42,0.25)]">
        <div className="mx-auto mb-6 inline-flex rounded-2xl bg-amber-50 p-4 text-amber-700">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">500</p>
        <h1 className="mt-3 text-4xl font-semibold">{t("errors.pageLoadTitle")}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {t("errors.pageLoadDescription")}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={() => window.location.reload()}
            type="button"
          >
            {t("errors.tryAgain")}
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/"
          >
            {t("errors.returnHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function Custom500Page() {
  return (
    <I18nProvider>
      <Custom500Content />
    </I18nProvider>
  );
}
