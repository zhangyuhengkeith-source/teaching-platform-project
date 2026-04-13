import Link from "next/link";

import { TranslationText } from "@/components/common/translation-text";
import { ExternalDashboard } from "@/components/dashboard/external-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { requireAuth } from "@/lib/auth/require-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { redirectAfterLogin } from "@/lib/auth/redirect-after-login";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const profile = await requireAuth();
  const params = await searchParams;
  const forcedView = params?.view;

  const view =
    forcedView === "teacher" || profile.role === "teacher" || profile.role === "super_admin"
      ? "teacher"
      : forcedView === "external" || profile.userType === "external"
        ? "external"
        : "student";

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard?view=teacher"><TranslationText translationKey="dashboard.teacherView" /></Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard?view=internal"><TranslationText translationKey="dashboard.internalStudentView" /></Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard?view=external"><TranslationText translationKey="dashboard.externalStudentView" /></Link>
            </Button>
          </div>
        }
        description={<TranslationText translationKey="dashboard.description" values={{ role: profile.role, target: redirectAfterLogin(profile) }} />}
        title={<TranslationText translationKey="dashboard.title" />}
      />
      {view === "teacher" ? <TeacherDashboard /> : null}
      {view === "student" ? <StudentDashboard /> : null}
      {view === "external" ? <ExternalDashboard /> : null}
    </div>
  );
}
