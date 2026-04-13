"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKey } from "@/lib/i18n/types";

const segmentKeyMap: Record<string, TranslationKey> = {
  admin: "nav.adminHome",
  classes: "nav.classes",
  dashboard: "nav.dashboard",
  electives: "nav.electives",
  "essay-marking": "nav.essayMarking",
  exercises: "nav.exercises",
  groups: "nav.groups",
  login: "nav.login",
  notices: "nav.notices",
  notifications: "nav.notifications",
  practice: "nav.practice",
  profile: "nav.profile",
  register: "nav.register",
  resources: "nav.resources",
  service: "nav.service",
  submissions: "nav.submissions",
  "wrong-book": "nav.wrongBook",
};

export function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <li>
          <Link className="transition hover:text-slate-900" href="/">
            {t("nav.home")}
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const label = segmentKeyMap[segment] ? t(segmentKeyMap[segment]) : segment.replace(/-/g, " ");
          return (
            <li className="flex items-center gap-1" key={href}>
              <ChevronRight className="h-4 w-4" />
              <Link className="capitalize transition hover:text-slate-900" href={href}>
                {label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
