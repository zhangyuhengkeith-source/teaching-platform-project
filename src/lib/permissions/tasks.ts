import type { AppUserProfile } from "@/types/auth";
import type { GroupDetail, SpaceMembershipSummary, SpaceSummary, TaskSubmissionSummary, TaskSummary } from "@/types/domain";

import { isInternalStudent } from "@/lib/permissions/profiles";
import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";

interface TaskAccessContext {
  space: Pick<SpaceSummary, "id" | "ownerId" | "status" | "type">;
  memberships?: Array<Pick<SpaceMembershipSummary, "profileId" | "membershipRole" | "status">>;
}

export function canManageTask(profile: AppUserProfile | null | undefined, context: TaskAccessContext) {
  return canManageSpace(profile, { space: context.space, memberships: context.memberships });
}

export function canViewTask(profile: AppUserProfile | null | undefined, task: Pick<TaskSummary, "status">, context: TaskAccessContext) {
  if (canManageTask(profile, context)) {
    return true;
  }

  return task.status === "published" && canViewSpace(profile, { space: context.space, memberships: context.memberships });
}

export function canEditSubmission(
  profile: AppUserProfile | null | undefined,
  submission: TaskSubmissionSummary | null | undefined,
  group: GroupDetail | null | undefined,
  task: TaskSummary,
  context: TaskAccessContext,
) {
  if (canManageTask(profile, context)) {
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

  if (context.space.type !== "elective" || !group || group.leaderProfileId !== profile.id) {
    return false;
  }

  if (!submission) {
    return true;
  }

  return submission.submitterGroupId === group.id && (submission.status === "draft" || submission.status === "returned" || submission.status === "overdue");
}

export function canViewSubmission(profile: AppUserProfile | null | undefined, submission: TaskSubmissionSummary, group: GroupDetail | null | undefined, context: TaskAccessContext) {
  if (canManageTask(profile, context)) {
    return true;
  }

  if (!profile) {
    return false;
  }

  if (submission.submitterProfileId) {
    return submission.submitterProfileId === profile.id;
  }

  return context.space.type === "elective" && Boolean(group && submission.submitterGroupId === group.id);
}

export function canReviewSubmission(profile: AppUserProfile | null | undefined, context: TaskAccessContext) {
  return canManageTask(profile, context);
}
