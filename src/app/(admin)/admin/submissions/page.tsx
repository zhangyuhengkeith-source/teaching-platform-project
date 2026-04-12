import { ScrollText } from "lucide-react";

import { AdminSubmissionTable } from "@/components/domain/admin-submission-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { requireRole } from "@/lib/auth/require-role";
import { listManageableSubmissions } from "@/lib/queries/electives";

export default async function AdminSubmissionsPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const submissions = await listManageableSubmissions(profile);

  return (
    <div className="space-y-6">
      <PageHeader description="Track draft, submitted, returned, and completed elective submissions across managed tasks." title="Manage Submissions" />
      <FilterBar>
        <SearchInput placeholder="Search submissions" />
      </FilterBar>
      {submissions.length > 0 ? (
        <AdminSubmissionTable items={submissions} />
      ) : (
        <EmptyState description="No submissions are available yet for the electives you manage." icon={ScrollText} title="No submissions yet" />
      )}
    </div>
  );
}
