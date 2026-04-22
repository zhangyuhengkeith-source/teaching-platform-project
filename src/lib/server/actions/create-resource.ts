"use server";

import { revalidatePath } from "next/cache";

import { createResource } from "@/lib/mutations/resources";
import { getSpaceById, listMembershipsForSpace, listSectionsForSpace } from "@/lib/queries/spaces";
import { createResourceSchema } from "@/lib/validations/resources";
import { requireAuth } from "@/lib/auth/require-auth";
import { normalizeClassScopedInput } from "@/lib/auth/class-permissions";
import { canManageSpace } from "@/lib/permissions/spaces";
import { generateUniqueSpaceContentSlug } from "@/lib/slugs/auto-slug";

export async function createResourceAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = createResourceSchema.parse(normalizeClassScopedInput(input));
  const space = await getSpaceById(parsed.space_id);

  if (!space) {
    throw new Error("Space not found.");
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    throw new Error("You do not have permission to create resources in this space.");
  }

  if (parsed.section_id) {
    const sections = await listSectionsForSpace(space.id);
    if (!sections.some((section) => section.id === parsed.section_id)) {
      throw new Error("Selected section does not belong to the chosen space.");
    }
  }

  const slug = parsed.slug ?? await generateUniqueSpaceContentSlug({
    className: space.title,
    moduleName: "resource",
    spaceId: space.id,
    table: "resources",
  });
  const resource = await createResource(profile.id, { ...parsed, slug });
  revalidatePath("/admin/resources");
  revalidatePath("/classes");
  return resource;
}
