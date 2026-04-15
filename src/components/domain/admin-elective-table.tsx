import Link from "next/link";

import { TranslationText } from "@/components/common/translation-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import type { SpaceSummary } from "@/types/domain";

export function AdminElectiveTable({ items }: { items: SpaceSummary[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.title" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.slug" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.academicYear" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.status" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.grouping" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.updated" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.action" /></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border" key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                <td className="px-4 py-3 text-slate-500">{item.slug}</td>
                <td className="px-4 py-3 text-slate-500">{item.academicYear ?? "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {item.groupingLocked ? <TranslationText translationKey="admin.tables.groupingLocked" /> : <TranslationText translationKey="admin.tables.groupingOpen" values={{ count: item.maxGroupSize ?? 4 }} />}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/electives/${item.id}/edit`}><TranslationText translationKey="admin.tables.edit" /></Link>
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
