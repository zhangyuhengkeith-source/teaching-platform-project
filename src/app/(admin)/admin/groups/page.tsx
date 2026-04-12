import { Users } from "lucide-react";

import { AdminGroupTable } from "@/components/domain/admin-group-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { requireRole } from "@/lib/auth/require-role";
import { listManageableGroups } from "@/lib/queries/electives";

export default async function AdminGroupsPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const groups = await listManageableGroups(profile);

  return (
    <div className="space-y-6">
      <PageHeader description="Review elective groups, identify leaders, and correct membership issues when needed." title="Manage Groups" />
      <FilterBar>
        <SearchInput placeholder="Search groups" />
      </FilterBar>
      {groups.length > 0 ? (
        <AdminGroupTable items={groups} />
      ) : (
        <EmptyState description="No groups have been formed in your electives yet." icon={Users} title="No groups yet" />
      )}
    </div>
  );
}
