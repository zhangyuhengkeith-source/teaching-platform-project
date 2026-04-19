import type { AppUserProfile } from "@/types/auth";
import { isBootstrapAdminEmail } from "@/lib/config/admin-access";

export function canAccessAdminBackoffice(profile: AppUserProfile | null | undefined) {
  return profile?.role === "super_admin" || isBootstrapAdminEmail(profile?.email);
}

export function canAccessAdminUsersPage(profile: AppUserProfile | null | undefined) {
  return canAccessAdminBackoffice(profile);
}
