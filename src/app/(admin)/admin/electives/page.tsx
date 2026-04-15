import Link from "next/link";
import { BookOpen } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
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
            <Link href="/admin/electives/new"><TranslationText translationKey="admin.electives.createAction" /></Link>
          </Button>
        }
        description={<TranslationText translationKey="admin.electives.description" />}
        title={<TranslationText translationKey="admin.electives.title" />}
      />
      <FilterBar>
        <SearchInput placeholderKey="admin.electives.searchPlaceholder" />
      </FilterBar>
      {electives.length > 0 ? (
        <AdminElectiveTable items={electives} />
      ) : (
        <EmptyState description={<TranslationText translationKey="admin.electives.emptyDescription" />} icon={BookOpen} title={<TranslationText translationKey="admin.electives.emptyTitle" />} />
      )}
    </div>
  );
}
