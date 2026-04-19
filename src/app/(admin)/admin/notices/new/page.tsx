import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { NoticeForm } from "@/components/domain/notice-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { listManageableNoticeSpaces } from "@/lib/queries/notices";

export default async function NewNoticePage() {
  const profile = await requireAuth();
  const spaces = await listManageableNoticeSpaces(profile);

  if (spaces.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.notices.newDescription" />} title={<TranslationText translationKey="admin.notices.newTitle" />} />
      <SectionCard description={<TranslationText translationKey="admin.notices.newDetailsDescription" />} title={<TranslationText translationKey="admin.notices.detailsTitle" />}>
        <NoticeForm mode="create" spaces={spaces} />
      </SectionCard>
    </div>
  );
}
