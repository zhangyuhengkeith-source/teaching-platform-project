import type { zhCN } from "@/lib/i18n/dictionaries/zh-CN";

export type Language = "zh-CN" | "en";

type DeepStringRecord<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringRecord<T[K]>;
    };

export type TranslationDictionary = DeepStringRecord<typeof zhCN>;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

export type NestedTranslationKey<T> = T extends Primitive
  ? never
  : {
      [K in Extract<keyof T, string>]: T[K] extends string
        ? K
        : T[K] extends Record<string, unknown>
          ? K | Join<K, NestedTranslationKey<T[K]>>
          : never;
    }[Extract<keyof T, string>];

export type TranslationKey = NestedTranslationKey<TranslationDictionary>;

export type TranslationValues = Record<string, string | number>;
