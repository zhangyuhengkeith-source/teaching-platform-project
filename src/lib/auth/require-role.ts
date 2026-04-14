import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";
import type { AppRole } from "@/types/auth";
import { ROUTES } from "@/lib/constants/routes";
import { isSuperAdmin } from "@/lib/permissions/profiles";

export async function requireRole(roles: AppRole[]) {
  const session = await getSession();
  const profile = session.profile;

  if (!profile) {
    redirect(ROUTES.login);
  }

  if (!(roles.includes(profile.role) || (roles.includes("super_admin") && isSuperAdmin(profile)))) {
    redirect(ROUTES.dashboard);
  }

  return profile;
}
