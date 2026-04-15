import Link from "next/link";

import { TranslationText } from "@/components/common/translation-text";
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
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.task" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.submitter" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.status" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.submitted" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.due" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.feedback" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.action" /></th>
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
                <td className="px-4 py-3 text-slate-500"><TranslationText translationKey={item.feedbackAt ? "admin.tables.returned" : "admin.tables.pending"} /></td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/submissions/${item.id}`}><TranslationText translationKey="admin.tables.review" /></Link>
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
