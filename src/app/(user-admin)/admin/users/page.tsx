import { UserRound } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { AdminClassCreateForm } from "@/components/domain/admin-class-create-form";
import { AdminUserTable } from "@/components/domain/admin-user-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { getBootstrapAdminEmails } from "@/lib/config/admin-access";
import { listAllClassSpaces, listMembershipsForSpace } from "@/lib/queries/spaces";
import { listProfiles } from "@/repositories/profile-repository";

export default async function AdminUsersPage() {
  const [users, classes] = await Promise.all([listProfiles(), listAllClassSpaces()]);
  const bootstrapAdminLabel = getBootstrapAdminEmails().join(", ");
  const memberships = (await Promise.all(classes.map((space) => listMembershipsForSpace(space.id)))).flat();
  const classMap = new Map(classes.map((space) => [space.id, space]));
  const membershipsByProfile = memberships.reduce<Record<string, string[]>>((accumulator, membership) => {
    if (membership.status !== "active") {
      return accumulator;
    }

    accumulator[membership.profileId] ??= [];
    if (!accumulator[membership.profileId].includes(membership.spaceId)) {
      accumulator[membership.profileId].push(membership.spaceId);
    }
    return accumulator;
  }, {});
  const enrichedUsers = users.map((user) => {
    const activeClassIds = membershipsByProfile[user.id] ?? [];

    return {
      ...user,
      activeClassIds,
      activeClassTitles: activeClassIds.map((spaceId) => classMap.get(spaceId)?.title).filter((title): title is string => Boolean(title)),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="admin.users.description" values={{ email: bootstrapAdminLabel }} />}
        title={<TranslationText translationKey="admin.users.title" />}
      />
      <SectionCard
        description={<TranslationText translationKey="admin.users.createClassDescription" />}
        title={<TranslationText translationKey="admin.users.createClassTitle" />}
      >
        <AdminClassCreateForm />
      </SectionCard>
      {enrichedUsers.length > 0 ? (
        <AdminUserTable classes={classes} items={enrichedUsers} />
      ) : (
        <EmptyState
          description={<TranslationText translationKey="admin.users.emptyDescription" />}
          icon={UserRound}
          title={<TranslationText translationKey="admin.users.emptyTitle" />}
        />
      )}
    </div>
  );
}
