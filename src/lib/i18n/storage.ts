import type { Language } from "@/lib/i18n/types";

export const I18N_STORAGE_KEY = "teaching-platform-language";

export function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(I18N_STORAGE_KEY);
  return value === "zh-CN" || value === "en" ? value : null;
}

export function writeStoredLanguage(language: Language) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(I18N_STORAGE_KEY, language);
}
