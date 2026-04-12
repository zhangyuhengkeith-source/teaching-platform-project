import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";
import { ROUTES } from "@/lib/constants/routes";

export async function requireAuth() {
  const session = await getSession();

  if (!session.isAuthenticated || !session.profile) {
    redirect(ROUTES.login);
  }

  return session.profile;
}

