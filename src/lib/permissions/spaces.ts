import type { AppUserProfile } from "@/types/auth";
import type { SpaceMembershipSummary, SpaceSummary } from "@/types/domain";
import type { SpaceMembershipRole } from "@/lib/constants/roles";

import { isExternalStudent, isSuperAdmin, isTeacher } from "@/lib/permissions/profiles";

interface SpaceAccessContext {
  space: Pick<SpaceSummary, "id" | "ownerId" | "status" | "type">;
  memberships?: Array<Pick<SpaceMembershipSummary, "profileId" | "membershipRole" | "status">>;
}

function hasActiveTeachingMembership(profileId: string, memberships: SpaceAccessContext["memberships"]) {
  return memberships?.some(
    (membership) =>
      membership.profileId === profileId &&
      membership.status === "active" &&
      (membership.membershipRole === "teacher" || membership.membershipRole === "assistant"),
  );
}

function hasActiveMembership(profileId: string, memberships: SpaceAccessContext["memberships"], roles?: SpaceMembershipRole[]) {
  return memberships?.some(
    (membership) =>
      membership.profileId === profileId &&
      membership.status === "active" &&
      (!roles || roles.includes(membership.membershipRole)),
  );
}

export function canManageSpace(profile: AppUserProfile | null | undefined, context: SpaceAccessContext) {
  if (!profile) {
    return false;
  }

  if (isSuperAdmin(profile)) {
    return true;
  }

  return isTeacher(profile) && (context.space.ownerId === profile.id || hasActiveTeachingMembership(profile.id, context.memberships));
}

export function canViewSpace(profile: AppUserProfile | null | undefined, context: SpaceAccessContext) {
  if (!profile) {
    return false;
  }

  if (canManageSpace(profile, context)) {
    return true;
  }

  if (isExternalStudent(profile)) {
    // TODO(Task 3): replace with DB-backed external-access flag if external-facing spaces are introduced.
    return false;
  }

  return Boolean(hasActiveMembership(profile.id, context.memberships));
}

