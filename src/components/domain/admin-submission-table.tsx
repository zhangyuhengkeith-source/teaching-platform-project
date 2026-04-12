import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/format";
import type { TaskSubmissionSummary } from "@/types/domain";

export function AdminSubmissionTable({ items }: { items: TaskSubmissionSummary[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Submitter</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Feedback</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border" key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.taskTitle ?? item.taskId}</td>
                <td className="px-4 py-3 text-slate-500">{item.groupName ?? item.submitterName ?? item.submitterProfileId ?? "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.effectiveStatus ?? item.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(item.submittedAt)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateTime(item.taskDueAt)}</td>
                <td className="px-4 py-3 text-slate-500">{item.feedbackAt ? "Returned" : "Pending"}</td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/submissions/${item.id}`}>Review</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
