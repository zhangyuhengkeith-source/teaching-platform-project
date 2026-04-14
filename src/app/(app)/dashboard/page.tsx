import { ExternalDashboard } from "@/components/dashboard/external-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { TranslationText } from "@/components/common/translation-text";
import { requireAuth } from "@/lib/auth/require-auth";
import { PageHeader } from "@/components/shared/page-header";
import { redirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { isExternalStudent, isTeacher } from "@/lib/permissions/profiles";

export default async function DashboardPage() {
  const profile = await requireAuth();
  const view = isTeacher(profile) ? "teacher" : isExternalStudent(profile) ? "external" : "student";

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="dashboard.description" values={{ role: profile.role, target: redirectAfterLogin(profile) }} />}
        title={<TranslationText translationKey="dashboard.title" />}
      />
      {view === "teacher" ? <TeacherDashboard /> : null}
      {view === "student" ? <StudentDashboard /> : null}
      {view === "external" ? <ExternalDashboard /> : null}
    </div>
  );
}
