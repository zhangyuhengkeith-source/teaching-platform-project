import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";

export interface NavItem {
  title?: string;
  titleKey?: TranslationKey;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
  description?: string;
}
