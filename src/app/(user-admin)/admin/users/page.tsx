import { UserRound } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { AdminUserTable } from "@/components/domain/admin-user-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getBootstrapAdminEmails } from "@/lib/config/admin-access";
import { listAllClassSpaces, listAllElectiveSpaces, listMembershipsForSpace } from "@/lib/queries/spaces";
import { listProfiles } from "@/repositories/profile-repository";
import type { SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

function buildActiveSpaceIdsByProfile(memberships: SpaceMembershipSummary[]) {
  return memberships.reduce<Record<string, string[]>>((accumulator, membership) => {
    if (membership.status !== "active") {
      return accumulator;
    }

    accumulator[membership.profileId] ??= [];
    if (!accumulator[membership.profileId].includes(membership.spaceId)) {
      accumulator[membership.profileId].push(membership.spaceId);
    }
    return accumulator;
  }, {});
}

function mapSpaceTitles(spaceIds: string[], spaceMap: Map<string, SpaceSummary>) {
  return spaceIds.map((spaceId) => spaceMap.get(spaceId)?.title).filter((title): title is string => Boolean(title));
}

export default async function AdminUsersPage() {
  const [users, classes, electives] = await Promise.all([listProfiles(), listAllClassSpaces(), listAllElectiveSpaces()]);
  const bootstrapAdminLabel = getBootstrapAdminEmails().join(", ");
  const classMap = new Map(classes.map((space) => [space.id, space]));
  const electiveMap = new Map(electives.map((space) => [space.id, space]));
  const [classMemberships, electiveMemberships] = await Promise.all([
    Promise.all(classes.map((space) => listMembershipsForSpace(space.id))),
    Promise.all(electives.map((space) => listMembershipsForSpace(space.id))),
  ]);
  const classMembershipsByProfile = buildActiveSpaceIdsByProfile(classMemberships.flat());
  const electiveMembershipsByProfile = buildActiveSpaceIdsByProfile(electiveMemberships.flat());

  const enrichedUsers = users.map((user) => {
    const activeClassIds = classMembershipsByProfile[user.id] ?? [];
    const activeElectiveIds = electiveMembershipsByProfile[user.id] ?? [];

    return {
      ...user,
      activeClassIds,
      activeClassTitles: mapSpaceTitles(activeClassIds, classMap),
      activeElectiveIds,
      activeElectiveTitles: mapSpaceTitles(activeElectiveIds, electiveMap),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        description={<TranslationText translationKey="admin.users.description" values={{ email: bootstrapAdminLabel }} />}
        title={<TranslationText translationKey="admin.users.title" />}
      />
      {enrichedUsers.length > 0 ? (
        <AdminUserTable classes={classes} electives={electives} items={enrichedUsers} />
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
