import type { AppUserProfile } from "@/types/auth";
import { ROUTES } from "@/lib/constants/routes";

export function redirectAfterLogin(profile: AppUserProfile) {
  if (profile.role === "super_admin" || profile.role === "teacher") {
    return ROUTES.admin;
  }

  return ROUTES.dashboard;
}

