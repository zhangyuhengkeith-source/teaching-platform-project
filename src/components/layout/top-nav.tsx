"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, GraduationCap, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/types/nav";

export function TopNav({
  items,
  title,
  actions,
}: {
  items: NavItem[];
  title: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  return (
    <header className="border-b border-border bg-white/90 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link className="flex items-center gap-3 text-slate-900" href="/">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("nav.platformTagline")}</p>
              <p className="text-sm font-semibold">{title}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <Link
                className={cn(
                  "rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "bg-slate-100 text-slate-900" : "",
                )}
                href={item.disabled ? "#" : item.href}
                key={item.href}
              >
                {item.titleKey ? t(item.titleKey) : item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <LanguageSwitcher />
          <Button aria-label={t("nav.notifications")} size="sm" variant="ghost">
            <Bell className="h-4 w-4" />
          </Button>
          <Button aria-label={t("nav.profile")} size="sm" variant="ghost">
            <UserRound className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
