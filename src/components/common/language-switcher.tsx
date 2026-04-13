"use client";

import { Button } from "@/components/ui/button";
import { LANGUAGE_OPTIONS } from "@/lib/i18n";
import type { Language } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/hooks/use-i18n";

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-white p-1 shadow-sm">
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = language === option.code;

        return (
          <Button
            className={cn(
              "h-8 rounded-lg px-3 text-xs font-semibold",
              isActive ? "bg-slate-900 text-white hover:bg-slate-900" : "text-slate-600 hover:bg-slate-100",
            )}
            key={option.code}
            onClick={() => setLanguage(option.code as Language)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
