import { notFound, redirect } from "next/navigation";

import { getClassSpaceBySlugForUser, getSectionBySlugForSpace } from "@/lib/queries/spaces";
import { requireAuth } from "@/lib/auth/require-auth";
import { isExternalStudent } from "@/lib/permissions/profiles";

export async function requireClassViewer() {
  const profile = await requireAuth();

  if (isExternalStudent(profile)) {
    redirect("/service");
  }

  return profile;
}

export async function requireAccessibleClassBySlug(spaceSlug: string) {
  const profile = await requireClassViewer();
  const space = await getClassSpaceBySlugForUser(spaceSlug, profile);

  if (!space) {
    notFound();
  }

  return { profile, space };
}

export async function requireAccessibleSection(spaceSlug: string, sectionSlug: string) {
  const { profile, space } = await requireAccessibleClassBySlug(spaceSlug);
  const section = await getSectionBySlugForSpace(space.id, sectionSlug);

  if (!section) {
    notFound();
  }

  return { profile, space, section };
}

