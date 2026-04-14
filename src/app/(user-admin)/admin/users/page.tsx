import { UserRound } from "lucide-react";

import { AdminClassCreateForm } from "@/components/domain/admin-class-create-form";
import { AdminUserTable } from "@/components/domain/admin-user-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ADMIN_USERS_EMAIL } from "@/lib/auth/admin-users-access";
import { listAllProfiles } from "@/lib/queries/profiles";
import { listAllClassSpaces, listMembershipsForSpace } from "@/lib/queries/spaces";

export default async function AdminUsersPage() {
  const [users, classes] = await Promise.all([listAllProfiles(), listAllClassSpaces()]);
  const memberships = (await Promise.all(classes.map((space) => listMembershipsForSpace(space.id)))).flat();
  const classMap = new Map(classes.map((space) => [space.id, space]));
  const membershipsByProfile = memberships.reduce<Record<string, string[]>>((accumulator, membership) => {
    if (membership.membershipRole !== "student" || membership.status !== "active") {
      return accumulator;
    }

    accumulator[membership.profileId] ??= [];
    accumulator[membership.profileId].push(membership.spaceId);
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
        description={`Only ${ADMIN_USERS_EMAIL} can open this page and change user roles, user types, or account status.`}
        title="Manage Users"
      />
      <SectionCard
        description="Create a new class directly from the super-admin console before assigning students."
        title="Create Class"
      >
        <AdminClassCreateForm />
      </SectionCard>
      {enrichedUsers.length > 0 ? (
        <AdminUserTable classes={classes} items={enrichedUsers} />
      ) : (
        <EmptyState
          description="No user profiles are available yet. New registered users will appear here after their first sign-in creates a profile row."
          icon={UserRound}
          title="No users yet"
        />
      )}
    </div>
  );
}
