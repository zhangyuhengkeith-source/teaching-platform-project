"use client";

import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey, TranslationValues } from "@/lib/i18n/types";

export function TranslationText({
  translationKey,
  values,
}: {
  translationKey: TranslationKey;
  values?: TranslationValues;
}) {
  const { t } = useI18n();

  return t(translationKey, values);
}
