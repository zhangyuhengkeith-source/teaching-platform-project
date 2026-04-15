import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { NoticeForm } from "@/components/domain/notice-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { getManageableNoticeById } from "@/lib/queries/notices";
import { listManageableClasses } from "@/lib/queries/spaces";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const [notice, spaces] = await Promise.all([getManageableNoticeById(id, profile), listManageableClasses(profile)]);

  if (!notice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.notices.editDescription" />} title={<TranslationText translationKey="admin.notices.editTitle" values={{ title: notice.title }} />} />
      <SectionCard description={<TranslationText translationKey="admin.notices.detailsDescription" />} title={<TranslationText translationKey="admin.notices.detailsTitle" />}>
        <NoticeForm
          initialValues={{
            id: notice.id,
            space_id: notice.spaceId,
            title: notice.title,
            body: notice.body,
            notice_type: notice.noticeType,
            publish_at: notice.publishAt ?? "",
            expire_at: notice.expireAt ?? "",
            is_pinned: notice.isPinned,
            status: notice.status,
          }}
          mode="edit"
          spaces={spaces}
        />
      </SectionCard>
    </div>
  );
}
