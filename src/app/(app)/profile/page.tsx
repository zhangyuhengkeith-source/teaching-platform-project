import { TranslationText } from "@/components/common/translation-text";
import { canAccessAdminBackoffice } from "@/lib/auth/admin-users-access";
import { requireAuth } from "@/lib/auth/require-auth";
import { listClassSpacesForUser } from "@/lib/queries/spaces";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

export default async function ProfilePage() {
  const profile = await requireAuth();
  const classes = await listClassSpacesForUser(profile);
  const effectiveRole = canAccessAdminBackoffice(profile) ? "super_admin" : profile.role;
  const roleKey =
    effectiveRole === "super_admin"
      ? "profile.roles.superAdmin"
      : effectiveRole === "teacher"
        ? "profile.roles.teacher"
        : "profile.roles.student";
  const classNames = classes.map((item) => item.title).join(" / ");

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="profile.description" />}
        title={<TranslationText translationKey="profile.title" />}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          description={<TranslationText translationKey="profile.accountDescription" />}
          title={<TranslationText translationKey="profile.accountTitle" />}
        >
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">
                <TranslationText translationKey="profile.fullName" />
              </dt>
              <dd className="font-medium">{profile.fullName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">
                <TranslationText translationKey="profile.email" />
              </dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">
                <TranslationText translationKey="profile.role" />
              </dt>
              <dd className="font-medium">
                <TranslationText translationKey={roleKey} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                <TranslationText translationKey="profile.classMembership" />
              </dt>
              <dd className="text-right font-medium">{classNames || <TranslationText translationKey="profile.unassignedClass" />}</dd>
            </div>
          </dl>
        </SectionCard>
        <SectionCard
          description={<TranslationText translationKey="profile.preferencesDescription" />}
          title={<TranslationText translationKey="profile.preferencesTitle" />}
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <TranslationText translationKey="profile.notificationPreferences" />
            </p>
            <p>
              <TranslationText translationKey="profile.languageAndTimezone" />
            </p>
            <p>
              <TranslationText translationKey="profile.onboardingCompleteness" />
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
