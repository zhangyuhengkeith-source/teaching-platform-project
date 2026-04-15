import { Users } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
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
      <PageHeader description={<TranslationText translationKey="admin.groups.description" />} title={<TranslationText translationKey="admin.groups.title" />} />
      <FilterBar>
        <SearchInput placeholderKey="admin.groups.searchPlaceholder" />
      </FilterBar>
      {groups.length > 0 ? (
        <AdminGroupTable items={groups} />
      ) : (
        <EmptyState description={<TranslationText translationKey="admin.groups.emptyDescription" />} icon={Users} title={<TranslationText translationKey="admin.groups.emptyTitle" />} />
      )}
    </div>
  );
}
