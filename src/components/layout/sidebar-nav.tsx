"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "@/types/nav";

export function SidebarNav({
  items,
  title,
  compact = false,
}: {
  items: NavItem[];
  title: string;
  compact?: boolean;
}) {
  const pathname = usePathname() ?? "";

  return (
    <aside className={cn("hidden border-r border-border bg-white lg:block", compact ? "w-72" : "w-64")}>
      <div className="sticky top-0 flex h-screen flex-col px-4 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{compact ? "Operations" : "Navigation"}</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                aria-disabled={item.disabled}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
                  item.disabled ? "cursor-not-allowed text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  active && !item.disabled ? "bg-blue-50 text-blue-900" : "",
                )}
                href={item.disabled ? "#" : item.href}
                key={item.href}
              >
                <span className="flex items-center gap-3">
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {item.title}
                </span>
                {item.disabled ? <Badge variant="muted">Soon</Badge> : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
