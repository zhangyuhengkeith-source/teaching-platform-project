import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
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
      <PageHeader description={<TranslationText translationKey="admin.resources.newDescription" />} title={<TranslationText translationKey="admin.resources.newTitle" />} />
      <SectionCard description="上传资源文件后，学生访问时会按班级成员权限生成短时下载链接。" title={<TranslationText translationKey="admin.resources.detailsTitle" />}>
        <ResourceForm mode="create" sections={sections} spaces={spaces} />
      </SectionCard>
    </div>
  );
}
