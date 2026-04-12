"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem } from "@/types/nav";

export function MobileNavDrawer({ items, title }: { items: NavItem[]; title: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden" size="sm" variant="outline">
          <Menu className="mr-2 h-4 w-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="space-y-6">
          <div>
            <SheetTitle className="text-left text-xl font-semibold">{title}</SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">Navigate the platform sections from a single mobile drawer.</p>
          </div>
          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50" href={item.disabled ? "#" : item.href} key={item.href}>
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

