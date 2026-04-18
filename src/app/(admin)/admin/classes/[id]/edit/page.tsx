import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { ClassForm } from "@/components/domain/class-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { getManageableClassById } from "@/lib/queries/spaces";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const item = await getManageableClassById(id, profile);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.classes.editDescription" />} title={<TranslationText translationKey="admin.classes.editTitle" values={{ title: item.title }} />} />
      <SectionCard description={<TranslationText translationKey="admin.classes.detailsDescription" />} title={<TranslationText translationKey="admin.classes.detailsTitle" />}>
        <ClassForm
          initialValues={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            type: item.type,
            description: item.description ?? "",
            academic_year: item.academicYear ?? "",
            status: item.status,
          }}
          mode="edit"
        />
      </SectionCard>
    </div>
  );
}
