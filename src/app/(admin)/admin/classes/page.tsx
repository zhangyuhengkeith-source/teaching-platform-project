import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { AdminClassTable } from "@/components/domain/admin-class-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/require-auth";
import { isAdminRole } from "@/lib/permissions/profiles";
import { listProfilesByIds } from "@/lib/queries/profiles";
import { listManageableClasses } from "@/lib/queries/spaces";

export default async function AdminClassesPage() {
  const profile = await requireAuth();
  const manageableClasses = await listManageableClasses(profile);
  const classes = isAdminRole(profile)
    ? manageableClasses
    : manageableClasses.filter((item) => (item.createdBy ?? item.ownerId) === profile.id);
  const owners = await listProfilesByIds([...new Set(classes.map((item) => item.ownerId))]);
  const ownerMap = Object.fromEntries(owners.map((owner) => [owner.id, owner.fullName]));
  const enriched = classes.map((item) => ({ ...item, ownerName: ownerMap[item.ownerId] ?? item.ownerId }));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/classes/new"><TranslationText translationKey="admin.classes.createAction" /></Link>
          </Button>
        }
        description={<TranslationText translationKey="admin.classes.description" />}
        title={<TranslationText translationKey="admin.classes.title" />}
      />
      <FilterBar>
        <SearchInput placeholderKey="admin.classes.searchPlaceholder" />
      </FilterBar>
      {enriched.length > 0 ? (
        <AdminClassTable items={enriched} />
      ) : (
        <EmptyState description={<TranslationText translationKey="admin.classes.emptyDescription" />} icon={GraduationCap} title={<TranslationText translationKey="admin.classes.emptyTitle" />} />
      )}
    </div>
  );
}
