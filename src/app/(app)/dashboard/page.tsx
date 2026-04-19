import { ExternalDashboard } from "@/components/dashboard/external-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { TranslationText } from "@/components/common/translation-text";
import { canAccessAdminBackoffice } from "@/lib/auth/admin-users-access";
import { requireAuth } from "@/lib/auth/require-auth";
import { PageHeader } from "@/components/shared/page-header";
import { isExternalStudent, isTeacher } from "@/lib/permissions/profiles";

export default async function DashboardPage() {
  const profile = await requireAuth();
  const view = isTeacher(profile) ? "teacher" : isExternalStudent(profile) ? "external" : "student";
  const effectiveRoleLabel = canAccessAdminBackoffice(profile) ? "super_admin" : profile.role;

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="dashboard.description" values={{ role: effectiveRoleLabel }} />}
        title={<TranslationText translationKey="dashboard.title" />}
      />
      {view === "teacher" ? <TeacherDashboard /> : null}
      {view === "student" ? <StudentDashboard /> : null}
      {view === "external" ? <ExternalDashboard /> : null}
    </div>
  );
}
