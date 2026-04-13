"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_LANGUAGE, translate } from "@/lib/i18n";
import { readStoredLanguage, writeStoredLanguage } from "@/lib/i18n/storage";
import type { Language, TranslationKey, TranslationValues } from "@/lib/i18n/types";

export interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey | string, values?: TranslationValues) => string;
  isMounted: boolean;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedLanguage = readStoredLanguage();

    if (storedLanguage) {
      setLanguageState(storedLanguage);
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;

    if (isMounted) {
      writeStoredLanguage(language);
    }
  }, [isMounted, language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, values) => translate(language, key, values),
      isMounted,
    }),
    [isMounted, language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
