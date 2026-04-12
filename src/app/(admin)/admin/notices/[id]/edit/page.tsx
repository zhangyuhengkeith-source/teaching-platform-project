import { notFound } from "next/navigation";

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
      <PageHeader description="Update notice content, timing, and publishing state." title={`Edit ${notice.title}`} />
      <SectionCard description="Pinned notices will stand out more clearly in the class learning flow." title="Notice details">
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
