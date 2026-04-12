import type { AppUserProfile } from "@/types/auth";
import type { GroupDetail, GroupSummary, SpaceMembershipSummary, SpaceSummary, TaskSubmissionSummary, TaskSummary } from "@/types/domain";

import { isExternalStudent, isInternalStudent, isTeacher } from "@/lib/permissions/profiles";
import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";

interface ElectiveAccessContext {
  space: Pick<SpaceSummary, "id" | "ownerId" | "status" | "type" | "groupingLocked" | "maxGroupSize">;
  memberships?: Array<Pick<SpaceMembershipSummary, "profileId" | "membershipRole" | "status">>;
}

export function canManageElective(profile: AppUserProfile | null | undefined, context: ElectiveAccessContext) {
  return context.space.type === "elective" && canManageSpace(profile, { space: context.space, memberships: context.memberships });
}

export function canViewElective(profile: AppUserProfile | null | undefined, context: ElectiveAccessContext) {
  if (!profile || context.space.type !== "elective" || isExternalStudent(profile)) {
    return false;
  }

  return canManageElective(profile, context) || canViewSpace(profile, { space: context.space, memberships: context.memberships });
}

export function canCreateOrJoinGroup(profile: AppUserProfile | null | undefined, context: ElectiveAccessContext) {
  return Boolean(profile && isInternalStudent(profile) && !context.space.groupingLocked && canViewElective(profile, context));
}

export function canViewGroup(profile: AppUserProfile | null | undefined, group: GroupSummary | GroupDetail, context: ElectiveAccessContext) {
  if (canManageElective(profile, context)) {
    return true;
  }

  if (!profile || !canViewElective(profile, context)) {
    return false;
  }

  return "members" in group ? group.members.some((member) => member.profileId === profile.id && member.status === "active") : false;
}

export function canEditGroup(profile: AppUserProfile | null | undefined, group: GroupDetail, context: ElectiveAccessContext) {
  if (canManageElective(profile, context)) {
    return true;
  }

  if (!profile || context.space.groupingLocked) {
    return false;
  }

  return group.leaderProfileId === profile.id;
}

export function canLeaveGroup(profile: AppUserProfile | null | undefined, group: GroupDetail, context: ElectiveAccessContext) {
  return Boolean(profile && !context.space.groupingLocked && group.members.some((member) => member.profileId === profile.id && member.status === "active"));
}

export function canViewTask(profile: AppUserProfile | null | undefined, task: Pick<TaskSummary, "status">, context: ElectiveAccessContext) {
  if (canManageElective(profile, context)) {
    return true;
  }

  return task.status === "published" && canViewElective(profile, context);
}

export function canEditTask(profile: AppUserProfile | null | undefined, context: ElectiveAccessContext) {
  return canManageElective(profile, context);
}

export function canEditSubmission(profile: AppUserProfile | null | undefined, submission: TaskSubmissionSummary | null | undefined, group: GroupDetail | null | undefined, task: TaskSummary, context: ElectiveAccessContext) {
  if (canManageElective(profile, context)) {
    return true;
  }

  if (!profile || !canViewTask(profile, task, context)) {
    return false;
  }

  if (task.submissionMode === "individual") {
    if (!submission) {
      return isInternalStudent(profile);
    }

    return submission.submitterProfileId === profile.id && (submission.status === "draft" || submission.status === "returned" || submission.status === "overdue");
  }

  if (!group || group.leaderProfileId !== profile.id) {
    return false;
  }

  if (!submission) {
    return true;
  }

  return submission.submitterGroupId === group.id && (submission.status === "draft" || submission.status === "returned" || submission.status === "overdue");
}

export function canViewSubmission(profile: AppUserProfile | null | undefined, submission: TaskSubmissionSummary, group: GroupDetail | null | undefined, context: ElectiveAccessContext) {
  if (canManageElective(profile, context)) {
    return true;
  }

  if (!profile) {
    return false;
  }

  if (submission.submitterProfileId) {
    return submission.submitterProfileId === profile.id;
  }

  return Boolean(group && submission.submitterGroupId === group.id);
}

export function canReviewSubmission(profile: AppUserProfile | null | undefined, context: ElectiveAccessContext) {
  return canManageElective(profile, context) || Boolean(profile && isTeacher(profile));
}
