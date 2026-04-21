import type { AppUserProfile } from "@/types/auth";
import type { NoticeSummary, SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";
import { isAdminRole } from "@/lib/permissions/profiles";
import { isNonArchivedContentStatus } from "@/lib/status/content-status";

interface NoticeAccessContext {
  notice: Pick<NoticeSummary, "status">;
  space: Pick<SpaceSummary, "id" | "ownerId" | "status" | "type">;
  memberships?: Array<Pick<SpaceMembershipSummary, "profileId" | "membershipRole" | "status">>;
}

export function canManageNotice(profile: AppUserProfile | null | undefined, context: NoticeAccessContext) {
  return canManageSpace(profile, {
    space: context.space,
    memberships: context.memberships,
  });
}

export function canViewNotice(profile: AppUserProfile | null | undefined, context: NoticeAccessContext) {
  if (!isAdminRole(profile) && !isNonArchivedContentStatus(context.notice.status)) {
    return false;
  }

  if (context.notice.status !== "published") {
    return canManageNotice(profile, context);
  }

  return canViewSpace(profile, {
    space: context.space,
    memberships: context.memberships,
  });
}
