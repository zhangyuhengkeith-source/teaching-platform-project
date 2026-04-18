import { ScrollText } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { AdminSubmissionTable } from "@/components/domain/admin-submission-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { requireRole } from "@/lib/auth/require-role";
import { listManageableSubmissions } from "@/lib/queries/tasks";

export default async function AdminSubmissionsPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const submissions = await listManageableSubmissions(profile);

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.submissions.description" />} title={<TranslationText translationKey="admin.submissions.title" />} />
      <FilterBar>
        <SearchInput placeholderKey="admin.submissions.searchPlaceholder" />
      </FilterBar>
      {submissions.length > 0 ? (
        <AdminSubmissionTable items={submissions} />
      ) : (
        <EmptyState description={<TranslationText translationKey="admin.submissions.emptyDescription" />} icon={ScrollText} title={<TranslationText translationKey="admin.submissions.emptyTitle" />} />
      )}
    </div>
  );
}
