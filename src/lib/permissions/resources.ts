import type { AppUserProfile } from "@/types/auth";
import type { ResourceSummary, SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";

interface ResourceAccessContext {
  resource: Pick<ResourceSummary, "visibility" | "status">;
  space: Pick<SpaceSummary, "id" | "ownerId" | "status" | "type">;
  memberships?: Array<Pick<SpaceMembershipSummary, "profileId" | "membershipRole" | "status">>;
}

export function canManageResource(profile: AppUserProfile | null | undefined, context: ResourceAccessContext) {
  return canManageSpace(profile, {
    space: context.space,
    memberships: context.memberships,
  });
}

export function canViewResource(profile: AppUserProfile | null | undefined, context: ResourceAccessContext) {
  if (context.resource.visibility === "public" && context.resource.status === "published") {
    return true;
  }

  return canViewSpace(profile, {
    space: context.space,
    memberships: context.memberships,
  });
}

