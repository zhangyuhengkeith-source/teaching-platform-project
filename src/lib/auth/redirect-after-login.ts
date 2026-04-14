import type { AppUserProfile } from "@/types/auth";
import { canAccessAdminBackoffice } from "@/lib/auth/admin-users-access";
import { ROUTES } from "@/lib/constants/routes";

export function redirectAfterLogin(profile: AppUserProfile) {
  if (profile.role === "super_admin" || profile.role === "teacher" || canAccessAdminBackoffice(profile)) {
    return ROUTES.admin;
  }

  return ROUTES.dashboard;
}
