import { en } from "@/lib/i18n/dictionaries/en";
import { zhCN } from "@/lib/i18n/dictionaries/zh-CN";
import type { Language, TranslationDictionary, TranslationKey, TranslationValues } from "@/lib/i18n/types";

export const DEFAULT_LANGUAGE: Language = "zh-CN";

export const dictionaries: Record<Language, TranslationDictionary> = {
  "zh-CN": zhCN,
  en,
};

export const LANGUAGE_OPTIONS = [
  { code: "zh-CN", label: "中" },
  { code: "en", label: "EN" },
] as const;

function getTranslationValue(dictionary: TranslationDictionary, key: string) {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, dictionary);
}

function interpolate(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? `{${token}}`));
}

export function translate(language: Language, key: TranslationKey | string, values?: TranslationValues) {
  const value = getTranslationValue(dictionaries[language], key);

  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing translation key: ${key}`);
    }

    return key;
  }

  return interpolate(value, values);
}
