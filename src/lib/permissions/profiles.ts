import type { AppUserProfile } from "@/types/auth";

export function isSuperAdmin(profile: AppUserProfile | null | undefined) {
  return profile?.role === "super_admin";
}

export function isTeacher(profile: AppUserProfile | null | undefined) {
  return profile?.role === "teacher" || isSuperAdmin(profile);
}

export function isInternalStudent(profile: AppUserProfile | null | undefined) {
  return profile?.role === "student" && profile.userType === "internal";
}

export function isExternalStudent(profile: AppUserProfile | null | undefined) {
  return profile?.role === "student" && profile.userType === "external";
}

