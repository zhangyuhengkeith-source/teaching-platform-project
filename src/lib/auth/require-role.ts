import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";
import type { AppRole } from "@/types/auth";
import { ROUTES } from "@/lib/constants/routes";

export async function requireRole(roles: AppRole[]) {
  const session = await getSession();
  const profile = session.profile;

  if (!profile) {
    redirect(ROUTES.login);
  }

  if (!roles.includes(profile.role)) {
    redirect(ROUTES.dashboard);
  }

  return profile;
}
