import Link from "next/link";
import { BookOpen } from "lucide-react";

import { AdminElectiveTable } from "@/components/domain/admin-elective-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { listManageableElectiveSpaces } from "@/lib/queries/electives";

export default async function AdminElectivesPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const electives = await listManageableElectiveSpaces(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/electives/new">Create elective</Link>
          </Button>
        }
        description="Manage elective spaces, grouping policy, and the task context used in collaborative project work."
        title="Manage Electives"
      />
      <FilterBar>
        <SearchInput placeholder="Search electives" />
      </FilterBar>
      {electives.length > 0 ? (
        <AdminElectiveTable items={electives} />
      ) : (
        <EmptyState description="No elective spaces are manageable yet. Create the first elective to begin the Module B workflow." icon={BookOpen} title="No electives yet" />
      )}
    </div>
  );
}
