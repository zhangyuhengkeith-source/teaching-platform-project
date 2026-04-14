import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";
import { canAccessAdminUsersPage } from "@/lib/auth/admin-users-access";
import { ROUTES } from "@/lib/constants/routes";

export async function requireAdminUsersAccess() {
  const session = await getSession();
  const profile = session.profile;

  if (!profile) {
    redirect(ROUTES.login);
  }

  if (!canAccessAdminUsersPage(profile)) {
    notFound();
  }

  return profile;
}
