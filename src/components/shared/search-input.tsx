"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n/types";

export function SearchInput({
  placeholder,
  placeholderKey = "forms.searchDefault",
}: {
  placeholder?: string;
  placeholderKey?: TranslationKey;
}) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t(placeholderKey);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input aria-label={resolvedPlaceholder} className="pl-9" placeholder={resolvedPlaceholder} />
    </div>
  );
}
