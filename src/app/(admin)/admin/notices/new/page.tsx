import { notFound } from "next/navigation";

import { NoticeForm } from "@/components/domain/notice-form";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { requireAuth } from "@/lib/auth/require-auth";
import { listManageableClasses } from "@/lib/queries/spaces";

export default async function NewNoticePage() {
  const profile = await requireAuth();
  const spaces = await listManageableClasses(profile);

  if (spaces.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description="Create a class notice for homework, deadlines, or broader class updates." title="Create Notice" />
      <SectionCard description="Students will see published notices in their class home pages and section pages." title="Notice details">
        <NoticeForm mode="create" spaces={spaces} />
      </SectionCard>
    </div>
  );
}

