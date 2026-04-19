import Link from "next/link";
import { ArrowRight, BookCheck, Layers3 } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExerciseSetStatus } from "@/lib/constants/statuses";
import type { ExerciseSetType } from "@/lib/constants/exercise-types";

interface ExerciseSetCardProps {
  title: string;
  instructions?: string | null;
  exerciseType: ExerciseSetType;
  itemCount?: number;
  sectionTitle?: string | null;
  status?: ExerciseSetStatus;
  href: string;
  actionLabel?: ReactNode;
}

const EXERCISE_TYPE_LABELS: Record<ExerciseSetType, string> = {
  mcq: "选择题",
  flashcard: "闪卡",
  term_recall: "术语回忆",
};

export function ExerciseSetCard({
  title,
  instructions,
  exerciseType,
  itemCount,
  sectionTitle,
  status,
  href,
  actionLabel = "进入练习",
}: ExerciseSetCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{EXERCISE_TYPE_LABELS[exerciseType]}</p>
          </div>
          {status ? <StatusBadge status={status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="min-h-12 text-sm leading-6 text-muted-foreground">{instructions ?? "与当前课程关联的针对性练习。"}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">题目数</p>
            <p className="mt-1 font-semibold text-slate-900">{itemCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">所属章节</p>
            <p className="mt-1 font-semibold text-slate-900">{sectionTitle ?? "班级通用"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <BookCheck className="h-4 w-4 text-primary" />
            引导式练习
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" />
            已关联课程流程
          </span>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={href}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
