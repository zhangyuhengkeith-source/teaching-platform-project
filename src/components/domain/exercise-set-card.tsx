import Link from "next/link";
import { ArrowRight, BookCheck, Layers3 } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExerciseSetTypeLabel } from "@/lib/utils/exercise";
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
  actionLabel?: string;
}

export function ExerciseSetCard({
  title,
  instructions,
  exerciseType,
  itemCount,
  sectionTitle,
  status,
  href,
  actionLabel = "Open practice",
}: ExerciseSetCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{getExerciseSetTypeLabel(exerciseType)}</p>
          </div>
          {status ? <StatusBadge status={status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="min-h-12 text-sm leading-6 text-muted-foreground">
          {instructions ?? "A focused practice set linked to this class."}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">Items</p>
            <p className="mt-1 font-semibold text-slate-900">{itemCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-slate-500">Section</p>
            <p className="mt-1 font-semibold text-slate-900">{sectionTitle ?? "Class-wide"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="inline-flex items-center gap-2">
            <BookCheck className="h-4 w-4 text-primary" />
            Guided practice
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-primary" />
            Linked to class flow
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
