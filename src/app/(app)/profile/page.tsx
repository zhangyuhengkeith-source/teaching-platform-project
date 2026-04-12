import { requireAuth } from "@/lib/auth/require-auth";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

export default async function ProfilePage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader description="A modest profile shell prepared for richer account settings and preferences." title="Profile" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard description="Current user identity resolved by centralized auth helpers." title="Account">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Full name</dt>
              <dd className="font-medium">{profile.fullName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium capitalize">{profile.role.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">User type</dt>
              <dd className="font-medium capitalize">{profile.userType}</dd>
            </div>
          </dl>
        </SectionCard>
        <SectionCard description="Future preferences can be layered here without changing the broader page shell." title="Preferences">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Notification preferences</p>
            <p>Language and timezone defaults</p>
            <p>Profile onboarding completeness</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

