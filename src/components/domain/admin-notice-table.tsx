import Link from "next/link";

import { TranslationText } from "@/components/common/translation-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import type { NoticeSummary } from "@/types/domain";

export function AdminNoticeTable({
  items,
  spaceTitles,
}: {
  items: NoticeSummary[];
  spaceTitles: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.title" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.class" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.type" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.publishAt" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.pinned" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.status" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.updated" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.action" /></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border" key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                <td className="px-4 py-3 text-slate-500">{spaceTitles[item.spaceId] ?? item.spaceId}</td>
                <td className="px-4 py-3 text-slate-500">
                  <TranslationText
                    translationKey={
                      item.noticeType === "mock_exam"
                        ? "admin.forms.noticeTypes.mockExam"
                        : item.noticeType === "service_update"
                          ? "admin.forms.noticeTypes.serviceUpdate"
                          : item.noticeType === "homework"
                            ? "admin.forms.noticeTypes.homework"
                            : item.noticeType === "deadline"
                              ? "admin.forms.noticeTypes.deadline"
                              : item.noticeType === "grouping"
                                ? "admin.forms.noticeTypes.grouping"
                                : "admin.forms.noticeTypes.general"
                    }
                  />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(item.publishAt)}</td>
                <td className="px-4 py-3">
                  {item.isPinned ? <Badge variant="primary"><TranslationText translationKey="admin.tables.pinnedValue" /></Badge> : <span className="text-slate-400">-</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/notices/${item.id}/edit`}><TranslationText translationKey="admin.tables.edit" /></Link>
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
