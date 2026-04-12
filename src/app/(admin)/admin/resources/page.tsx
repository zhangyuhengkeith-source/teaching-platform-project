import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { AdminResourceTable } from "@/components/domain/admin-resource-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/require-auth";
import { listManageableResources } from "@/lib/queries/resources";
import { listManageableClasses, listSectionsForSpace } from "@/lib/queries/spaces";

export default async function AdminResourcesPage() {
  const profile = await requireAuth();
  const [resources, classes] = await Promise.all([listManageableResources(profile), listManageableClasses(profile)]);
  const allSections = (await Promise.all(classes.map((space) => listSectionsForSpace(space.id)))).flat();
  const spaceTitles = Object.fromEntries(classes.map((space) => [space.id, space.title]));
  const sectionTitles = Object.fromEntries(allSections.map((section) => [section.id, section.title]));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild>
            <Link href="/admin/resources/new">Create resource</Link>
          </Button>
        }
        description="Manage teaching resources across classes, including type, visibility, and publishing state."
        title="Manage Resources"
      />
      <FilterBar>
        <SearchInput placeholder="Search resources" />
      </FilterBar>
      {resources.length > 0 ? (
        <AdminResourceTable items={resources} sectionTitles={sectionTitles} spaceTitles={spaceTitles} />
      ) : (
        <EmptyState description="No resources are available yet. Create the first teaching material for one of your classes." icon={FolderKanban} title="No resources yet" />
      )}
    </div>
  );
}

