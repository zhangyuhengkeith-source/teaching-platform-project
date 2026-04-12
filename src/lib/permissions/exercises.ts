import type { AppUserProfile } from "@/types/auth";
import type { ExerciseItemSummary, ExerciseSetSummary, SpaceMembershipSummary, SpaceSummary, WrongBookItemSummary } from "@/types/domain";

import { isTeacher } from "@/lib/permissions/profiles";
import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";

interface ExerciseAccessContext {
  exerciseSet: Pick<ExerciseSetSummary, "status" | "spaceId">;
  space: Pick<SpaceSummary, "id" | "ownerId" | "status" | "type">;
  memberships?: Array<Pick<SpaceMembershipSummary, "profileId" | "membershipRole" | "status">>;
}

export function canManageExerciseSet(profile: AppUserProfile | null | undefined, context: ExerciseAccessContext) {
  return canManageSpace(profile, {
    space: context.space,
    memberships: context.memberships,
  });
}

export function canViewExerciseSet(profile: AppUserProfile | null | undefined, context: ExerciseAccessContext) {
  if (canManageExerciseSet(profile, context)) {
    return true;
  }

  return context.exerciseSet.status === "published" && canViewSpace(profile, {
    space: context.space,
    memberships: context.memberships,
  });
}

export function canManageExerciseItem(profile: AppUserProfile | null | undefined, context: ExerciseAccessContext & { item: Pick<ExerciseItemSummary, "exerciseSetId"> }) {
  return canManageExerciseSet(profile, context);
}

export function canSubmitExerciseAttempt(profile: AppUserProfile | null | undefined, context: ExerciseAccessContext) {
  if (!profile) {
    return false;
  }

  if (isTeacher(profile)) {
    return canManageExerciseSet(profile, context);
  }

  return canViewExerciseSet(profile, context);
}

export function canViewWrongBook(profile: AppUserProfile | null | undefined, wrongBookProfileId: string) {
  if (!profile) {
    return false;
  }

  if (isTeacher(profile)) {
    return false;
  }

  return profile.id === wrongBookProfileId;
}

export function canRetryWrongBookItem(profile: AppUserProfile | null | undefined, item: WrongBookItemSummary) {
  return canViewWrongBook(profile, item.profileId) && item.status === "active";
}
