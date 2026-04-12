import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { AdminClassTable } from "@/components/domain/admin-class-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/require-auth";
import { listProfilesByIds } from "@/lib/queries/profiles";
import { listManageableClasses } from "@/lib/queries/spaces";

export default async function AdminClassesPage() {
  const profile = await requireAuth();
  const classes = await listManageableClasses(profile);
  const owners = await listProfilesByIds([...new Set(classes.map((item) => item.ownerId))]);
  const ownerMap = Object.fromEntries(owners.map((owner) => [owner.id, owner.fullName]));
  const enriched = classes.map((item) => ({ ...item, ownerName: ownerMap[item.ownerId] ?? item.ownerId }));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/classes/new">Create class</Link>
          </Button>
        }
        description="Manage class spaces, academic-year metadata, and publishing state for the teaching workflow."
        title="Manage Classes"
      />
      <FilterBar>
        <SearchInput placeholder="Search classes" />
      </FilterBar>
      {enriched.length > 0 ? (
        <AdminClassTable items={enriched} />
      ) : (
        <EmptyState description="No class spaces are manageable yet. Create your first class to begin Module A." icon={GraduationCap} title="No classes yet" />
      )}
    </div>
  );
}

