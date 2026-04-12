import { notFound } from "next/navigation";

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
      <PageHeader description="Update class metadata and publishing state." title={`Edit ${item.title}`} />
      <SectionCard description="Changes here will affect class discovery and access across the teaching slice." title="Class details">
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

