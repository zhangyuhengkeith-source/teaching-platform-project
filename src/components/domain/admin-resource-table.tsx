import Link from "next/link";

import { TranslationText } from "@/components/common/translation-text";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import type { ResourceSummary } from "@/types/domain";

export function AdminResourceTable({
  items,
  spaceTitles,
  sectionTitles,
}: {
  items: ResourceSummary[];
  spaceTitles: Record<string, string>;
  sectionTitles: Record<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.title" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.type" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.class" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.section" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.visibility" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.status" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.updated" /></th>
              <th className="px-4 py-3 font-medium"><TranslationText translationKey="admin.tables.action" /></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border" key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                <td className="px-4 py-3 text-slate-500">
                  <TranslationText translationKey={item.resourceType === "case_analysis" ? "admin.forms.resourceTypes.caseAnalysis" : item.resourceType === "model_answer" ? "admin.forms.resourceTypes.modelAnswer" : item.resourceType === "mock_paper" ? "admin.forms.resourceTypes.mockPaper" : item.resourceType === "mark_scheme" ? "admin.forms.resourceTypes.markScheme" : item.resourceType === "revision" ? "admin.forms.resourceTypes.revision" : item.resourceType === "extension" ? "admin.forms.resourceTypes.extension" : item.resourceType === "worksheet" ? "admin.forms.resourceTypes.worksheet" : item.resourceType === "other" ? "admin.forms.resourceTypes.other" : "admin.forms.resourceTypes.ppt"} />
                </td>
                <td className="px-4 py-3 text-slate-500">{spaceTitles[item.spaceId] ?? item.spaceId}</td>
                <td className="px-4 py-3 text-slate-500">{item.sectionId ? sectionTitles[item.sectionId] ?? item.sectionId : <TranslationText translationKey="admin.tables.noSection" />}</td>
                <td className="px-4 py-3">
                  <Badge variant="muted">
                    <TranslationText translationKey={item.visibility === "selected_members" ? "admin.forms.visibilityOptions.selectedMembers" : item.visibility === "public" ? "admin.forms.visibilityOptions.public" : "admin.forms.visibilityOptions.space"} />
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/resources/${item.id}/edit`}><TranslationText translationKey="admin.tables.edit" /></Link>
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
