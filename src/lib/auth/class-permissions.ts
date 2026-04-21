import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { isAdminRole, isTeacher } from "@/lib/permissions/profiles";
import type { AppUserProfile } from "@/types/auth";
import type { SpaceMembershipSummary, SpaceSummary } from "@/types/domain";

export interface ClassAccessContext {
  classSpace: SpaceSummary;
  memberships: SpaceMembershipSummary[];
}

export function hasAssignedTeacherAccess(profile: AppUserProfile | null | undefined, memberships: SpaceMembershipSummary[]) {
  if (!profile || !isTeacher(profile)) {
    return false;
  }

  return memberships.some(
    (membership) =>
      membership.profileId === profile.id &&
      membership.status === "active" &&
      (membership.membershipRole === "teacher" || membership.membershipRole === "assistant"),
  );
}

export function canAccessClass(profile: AppUserProfile | null | undefined, context: ClassAccessContext) {
  if (!profile || context.classSpace.type !== "class") {
    return false;
  }

  if (isAdminRole(profile)) {
    return true;
  }

  if (context.classSpace.ownerId === profile.id) {
    return true;
  }

  return hasAssignedTeacherAccess(profile, context.memberships);
}

export async function requireClassAccess(profile: AppUserProfile, classId: string): Promise<ClassAccessContext> {
  const classSpace = await getSpaceById(classId);

  if (!classSpace || classSpace.type !== "class") {
    throw new Error("Class not found.");
  }

  const memberships = await listMembershipsForSpace(classSpace.id);
  if (!canAccessClass(profile, { classSpace, memberships })) {
    throw new Error("You do not have permission to access this class.");
  }

  return { classSpace, memberships };
}

export function bindClassScopedInput<T extends Record<string, unknown>>(input: T, classId: string): T & { space_id: string } {
  return {
    ...input,
    space_id: classId,
  };
}

export function normalizeClassScopedInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const record = input as Record<string, unknown>;
  if (typeof record.space_id === "string" || typeof record.class_id !== "string") {
    return input;
  }

  return bindClassScopedInput(record, record.class_id);
}
