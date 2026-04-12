import { notFound } from "next/navigation";

import { ResourceForm } from "@/components/domain/resource-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { listManageableClasses, listSectionsForSpace } from "@/lib/queries/spaces";

export default async function NewResourcePage() {
  const profile = await requireAuth();
  const spaces = await listManageableClasses(profile);

  if (spaces.length === 0) {
    notFound();
  }

  const sections = (await Promise.all(spaces.map((space) => listSectionsForSpace(space.id)))).flat();

  return (
    <div className="space-y-6">
      <PageHeader description="Create a learning resource and assign it to a class and optional section." title="Create Resource" />
      <SectionCard description="File uploads are intentionally deferred, but the metadata is ready for them." title="Resource details">
        <ResourceForm mode="create" sections={sections} spaces={spaces} />
      </SectionCard>
    </div>
  );
}

