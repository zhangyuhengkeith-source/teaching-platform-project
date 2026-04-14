import type { AppUserProfile } from "@/types/auth";

export const ADMIN_USERS_EMAIL = "zhangyuheng_andy@163.com";

export function canAccessAdminBackoffice(profile: AppUserProfile | null | undefined) {
  return profile?.email.toLowerCase() === ADMIN_USERS_EMAIL;
}

export function canAccessAdminUsersPage(profile: AppUserProfile | null | undefined) {
  return canAccessAdminBackoffice(profile);
}
