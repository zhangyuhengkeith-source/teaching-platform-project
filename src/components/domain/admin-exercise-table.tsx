import Link from "next/link";

import { TranslationText } from "@/components/common/translation-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { getExerciseSetTypeLabelKey } from "@/lib/utils/exercise";
import type { ExerciseSetSummary } from "@/types/domain";

export function AdminExerciseTable({
  items,
}: {
  items: ExerciseSetSummary[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.title" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.class" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.section" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.type" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.status" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.updated" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.action" /></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border" key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                <td className="px-4 py-3 text-slate-500">{item.spaceTitle ?? item.spaceId}</td>
                <td className="px-4 py-3 text-slate-500">{item.sectionTitle ?? <TranslationText translationKey="admin.tables.classWide" />}</td>
                <td className="px-4 py-3 text-slate-500"><TranslationText translationKey={getExerciseSetTypeLabelKey(item.exerciseType)} /></td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-slate-500">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/exercises/${item.id}/edit`}><TranslationText translationKey="admin.tables.edit" /></Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.spaceSlug ? `/classes/${item.spaceSlug}/practice/${item.slug}` : "#"}><TranslationText translationKey="admin.tables.preview" /></Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
