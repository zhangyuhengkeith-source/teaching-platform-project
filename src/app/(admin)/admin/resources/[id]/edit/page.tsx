import { notFound } from "next/navigation";

import { ResourceForm } from "@/components/domain/resource-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { getManageableResourceById } from "@/lib/queries/resources";
import { listManageableClasses, listSectionsForSpace } from "@/lib/queries/spaces";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const [resource, spaces] = await Promise.all([getManageableResourceById(id, profile), listManageableClasses(profile)]);

  if (!resource) {
    notFound();
  }

  const sections = (await Promise.all(spaces.map((space) => listSectionsForSpace(space.id)))).flat();

  return (
    <div className="space-y-6">
      <PageHeader description="Update teaching-resource metadata, visibility, and publishing state." title={`Edit ${resource.title}`} />
      <SectionCard description="Resource files can be attached in the next storage-focused task." title="Resource details">
        <ResourceForm
          initialValues={{
            id: resource.id,
            space_id: resource.spaceId,
            section_id: resource.sectionId ?? null,
            title: resource.title,
            slug: resource.slug,
            description: resource.description ?? "",
            resource_type: resource.resourceType,
            visibility: resource.visibility,
            status: resource.status,
            published_at: resource.publishedAt ?? "",
            sort_order: resource.sortOrder,
          }}
          mode="edit"
          sections={sections}
          spaces={spaces}
        />
      </SectionCard>
    </div>
  );
}
