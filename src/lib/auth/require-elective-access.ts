import { notFound, redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-auth";
import { getElectiveSpaceBySlugForUser, getTaskBySlugForUser } from "@/lib/queries/electives";
import { isExternalStudent } from "@/lib/permissions/profiles";

export async function requireElectiveViewer() {
  const profile = await requireAuth();

  if (isExternalStudent(profile)) {
    redirect("/service");
  }

  return profile;
}

export async function requireAccessibleElectiveBySlug(spaceSlug: string) {
  const profile = await requireElectiveViewer();
  const space = await getElectiveSpaceBySlugForUser(spaceSlug, profile);

  if (!space) {
    notFound();
  }

  return { profile, space };
}

export async function requireAccessibleElectiveTask(spaceSlug: string, taskSlug: string) {
  const profile = await requireElectiveViewer();
  const task = await getTaskBySlugForUser(spaceSlug, taskSlug, profile);

  if (!task) {
    notFound();
  }

  return { profile, task };
}
