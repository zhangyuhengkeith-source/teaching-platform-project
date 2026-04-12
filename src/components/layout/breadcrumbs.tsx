"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <li>
          <Link className="transition hover:text-slate-900" href="/">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          return (
            <li className="flex items-center gap-1" key={href}>
              <ChevronRight className="h-4 w-4" />
              <Link className="capitalize transition hover:text-slate-900" href={href}>
                {segment.replace(/-/g, " ")}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
