import type { AppRole, ProfileStatus, UserType } from "@/types/auth";

export const APP_ROLES: AppRole[] = ["super_admin", "teacher", "student"];
export const USER_TYPES: UserType[] = ["internal", "external"];
export const PROFILE_STATUSES: ProfileStatus[] = ["active", "inactive", "suspended"];

export const SPACE_MEMBERSHIP_ROLES = ["student", "teacher", "assistant", "group_leader"] as const;
export const SPACE_MEMBERSHIP_STATUSES = ["active", "pending", "removed"] as const;

export type SpaceMembershipRole = (typeof SPACE_MEMBERSHIP_ROLES)[number];
export type SpaceMembershipStatus = (typeof SPACE_MEMBERSHIP_STATUSES)[number];
