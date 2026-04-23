import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { ClassForm } from "@/components/domain/class-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { isAdminRole } from "@/lib/permissions/profiles";
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

  if (!isAdminRole(profile) && (item.createdBy ?? item.ownerId) !== profile.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.classes.editDescription" />} title={<TranslationText translationKey="admin.classes.editTitle" values={{ title: item.title }} />} />
      {!isAdminRole(profile) ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          教师编辑班级信息需要超管审批。提交后，审批通过前班级信息和状态保持当前版本。
        </p>
      ) : null}
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
