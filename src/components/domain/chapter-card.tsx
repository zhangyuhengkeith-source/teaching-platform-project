import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionType } from "@/types/database";

interface ChapterCardProps {
  title: string;
  description?: string | null;
  type: SectionType;
  resourceCount?: number;
  href: string;
}

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  chapter: "章节",
  module: "模块",
  week: "周次",
  topic_group: "专题组",
};

export function ChapterCard({ title, description, type, resourceCount, href }: ChapterCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{SECTION_TYPE_LABELS[type]}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <Layers3 className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{description ?? "章节简介会显示在这里，帮助你快速了解本部分内容。"}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{resourceCount ?? 0} 份资源</span>
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={href}>
            进入章节
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
