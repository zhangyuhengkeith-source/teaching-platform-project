import { Badge } from "@/components/ui/badge";
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

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge className="capitalize" variant={variantMap[status]}>
      {status}
    </Badge>
  );
}
