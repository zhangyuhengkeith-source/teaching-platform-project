"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import type { Status } from "@/lib/constants/statuses";

const variantMap: Record<Status, "muted" | "primary" | "warning" | "success"> = {
  draft: "muted",
  published: "primary",
  archived: "muted",
  pending: "warning",
  active: "success",
  completed: "primary",
  mastered: "success",
  forming: "warning",
  locked: "muted",
  submitted: "primary",
  overdue: "warning",
  returned: "warning",
  resubmitted: "primary",
};

const statusKeyMap: Record<Status, "status.draft" | "status.published" | "status.archived" | "status.pending" | "status.active" | "status.completed" | "status.mastered" | "status.forming" | "status.locked" | "status.submitted" | "status.overdue" | "status.returned" | "status.resubmitted"> = {
  draft: "status.draft",
  published: "status.published",
  archived: "status.archived",
  pending: "status.pending",
  active: "status.active",
  completed: "status.completed",
  mastered: "status.mastered",
  forming: "status.forming",
  locked: "status.locked",
  submitted: "status.submitted",
  overdue: "status.overdue",
  returned: "status.returned",
  resubmitted: "status.resubmitted",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();

  return (
    <Badge className="capitalize" variant={variantMap[status]}>
      {t(statusKeyMap[status])}
    </Badge>
  );
}
