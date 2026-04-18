import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
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
      <PageHeader description={<TranslationText translationKey="admin.resources.editDescription" />} title={<TranslationText translationKey="admin.resources.editTitle" values={{ title: resource.title }} />} />
      <SectionCard description="你可以继续追加文件，或移除不再开放的附件；下载仍会经过服务端鉴权。" title={<TranslationText translationKey="admin.resources.detailsTitle" />}>
        <ResourceForm
          initialFiles={resource.files ?? []}
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
