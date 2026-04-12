import Link from "next/link";
import { ClipboardList } from "lucide-react";

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
            <Link href="/admin/exercises/new">Create exercise set</Link>
          </Button>
        }
        description="Manage practice sets, their linked classes, and the item-builder flow used for auto-graded study."
        title="Manage Exercises"
      />
      <FilterBar>
        <SearchInput placeholder="Search exercise sets" />
      </FilterBar>
      {items.length > 0 ? (
        <AdminExerciseTable items={items} />
      ) : (
        <EmptyState description="No exercise sets are available yet. Create the first practice set for a class section." icon={ClipboardList} title="No exercise sets yet" />
      )}
    </div>
  );
}
