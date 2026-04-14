import { Clock3 } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { canAccessAdminBackoffice } from "@/lib/auth/admin-users-access";
import { WaitingAssignmentSignOutButton } from "@/components/domain/waiting-assignment-sign-out-button";
import { getSession } from "@/lib/auth/get-session";
import { ROUTES } from "@/lib/constants/routes";
import { hasActiveClassMembership } from "@/lib/queries/spaces";

export const dynamic = "force-dynamic";

export default async function WaitingAssignmentPage() {
  const session = await getSession();
  const profile = session.profile;

  if (!session.isAuthenticated || !profile) {
    redirect(ROUTES.login);
  }

  if (canAccessAdminBackoffice(profile)) {
    redirect(ROUTES.admin);
  }

  if (profile.role !== "student" || profile.userType !== "internal") {
    redirect(ROUTES.dashboard);
  }

  if (await hasActiveClassMembership(profile.id)) {
    redirect(ROUTES.dashboard);
  }

  return (
    <div className="container-shell space-y-6 py-10">
      <PageHeader
        description="你的账号已经注册成功，但当前还没有被分配到任何班级。在管理员完成分班前，你暂时不能进入学习平台的其他页面。"
        title="等待分配班级"
      />
      <SectionCard
        description="一旦该账号被加入至少一个有效班级，你就可以正常进入仪表盘、班级页面和其他学习功能。"
        title="账号待激活"
      >
        <EmptyState
          action={<WaitingAssignmentSignOutButton />}
          description="请联系管理员或老师，将你的账号分配到对应班级。分班完成前，本账号只能停留在当前页面，无法访问其他任何学习页面。"
          icon={Clock3}
          title="当前尚未完成班级分配"
        />
      </SectionCard>
    </div>
  );
}
