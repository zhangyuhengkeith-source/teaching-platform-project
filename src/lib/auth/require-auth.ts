import { redirect } from "next/navigation";

import { canAccessAdminUsersPage } from "@/lib/auth/admin-users-access";
import { getSession } from "@/lib/auth/get-session";
import { ROUTES } from "@/lib/constants/routes";
import { hasActiveClassMembership } from "@/lib/queries/spaces";

export async function requireAuth() {
  const session = await getSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect(ROUTES.login);
  }

  if (
    session.profile.role === "student" &&
    session.profile.userType === "internal" &&
    !canAccessAdminUsersPage(session.profile) &&
    !(await hasActiveClassMembership(session.profile.id))
  ) {
    redirect(ROUTES.assignmentPending);
  }

  return session.profile;
}
