import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { AdminExerciseTable } from "@/components/domain/admin-exercise-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { listManageableExerciseSets } from "@/lib/queries/exercises";

export default async function AdminExercisesPage() {
  const profile = await requireRole(["super_admin", "teacher"]);
  const items = await listManageableExerciseSets(profile);

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/exercises/new"><TranslationText translationKey="admin.exercises.createAction" /></Link>
          </Button>
        }
        description={<TranslationText translationKey="admin.exercises.description" />}
        title={<TranslationText translationKey="admin.exercises.title" />}
      />
      <FilterBar>
        <SearchInput placeholderKey="admin.exercises.searchPlaceholder" />
      </FilterBar>
      {items.length > 0 ? (
        <AdminExerciseTable items={items} />
      ) : (
        <EmptyState description={<TranslationText translationKey="admin.exercises.emptyDescription" />} icon={ClipboardList} title={<TranslationText translationKey="admin.exercises.emptyTitle" />} />
      )}
    </div>
  );
}
