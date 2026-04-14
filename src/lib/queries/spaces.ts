import { mapSpaceMembershipRow, mapSpaceRow, mapSpaceSectionRow } from "@/lib/db/mappers";
import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";
import { isTeacher } from "@/lib/permissions/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedMemberships, seedSections, seedSpaces } from "@/lib/seed/seed";
import type { AppUserProfile } from "@/types/auth";
import type { SpaceDetail, SpaceMembershipSummary, SpaceSectionSummary, SpaceSummary } from "@/types/domain";

async function getMembershipsForProfile(profileId: string): Promise<SpaceMembershipSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedMemberships.filter((membership) => membership.profileId === profileId);
  }

  const { data, error } = await supabase.from("space_memberships").select("*").eq("profile_id", profileId);
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceMembershipRow);
}

export async function listSpacesForUser(profileId: string): Promise<SpaceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const memberships = seedMemberships.filter((membership) => membership.profileId === profileId && membership.status === "active");
    const visibleSpaceIds = new Set([...memberships.map((membership) => membership.spaceId), ...seedSpaces.filter((space) => space.ownerId === profileId).map((space) => space.id)]);
    return seedSpaces.filter((space) => visibleSpaceIds.has(space.id));
  }

  const memberships = await getMembershipsForProfile(profileId);
  const membershipSpaceIds = memberships.filter((membership) => membership.status === "active").map((membership) => membership.spaceId);

  const { data, error } = await supabase.from("spaces").select("*").or(`owner_id.eq.${profileId},id.in.(${membershipSpaceIds.length > 0 ? membershipSpaceIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceRow);
}

export async function listClassSpacesForUser(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = await listSpacesForUser(profile.id);
  return spaces.filter((space) => space.type === "class");
}

export async function getSpaceBySlugForUser(slug: string, profileId: string): Promise<SpaceDetail | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const space = seedSpaces.find((entry) => entry.slug === slug) ?? null;
    if (!space) {
      return null;
    }
    const memberships = seedMemberships.filter((membership) => membership.spaceId === space.id);
    const sections = seedSections.filter((section) => section.spaceId === space.id);
    return { ...space, memberships, sections };
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) {
    return null;
  }

  const space = mapSpaceRow(data);
  const memberships = await listMembershipsForSpace(space.id);
  const canSeeSpace = memberships.some((membership) => membership.profileId === profileId && membership.status === "active") || space.ownerId === profileId;

  if (!canSeeSpace) {
    return null;
  }

  const sections = await listSectionsForSpace(space.id);
  return { ...space, memberships, sections };
}

export async function getClassSpaceBySlugForUser(slug: string, profile: AppUserProfile): Promise<SpaceDetail | null> {
  const space = await getSpaceBySlugForUser(slug, profile.id);

  if (!space || space.type !== "class") {
    return null;
  }

  if (!canViewSpace(profile, { space, memberships: space.memberships })) {
    return null;
  }

  return space;
}

export async function listSectionsForSpace(spaceId: string): Promise<SpaceSectionSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSections.filter((section) => section.spaceId === spaceId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("space_sections").select("*").eq("space_id", spaceId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceSectionRow);
}

export async function listMembershipsForSpace(spaceId: string): Promise<SpaceMembershipSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedMemberships.filter((membership) => membership.spaceId === spaceId);
  }

  const { data, error } = await supabase.from("space_memberships").select("*").eq("space_id", spaceId);
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceMembershipRow);
}

export async function getSpaceById(spaceId: string): Promise<SpaceSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.find((space) => space.id === spaceId) ?? null;
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("id", spaceId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSpaceRow(data);
}

export async function getSectionBySlugForSpace(spaceId: string, sectionSlug: string): Promise<SpaceSectionSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSections.find((section) => section.spaceId === spaceId && section.slug === sectionSlug) ?? null;
  }

  const { data, error } = await supabase.from("space_sections").select("*").eq("space_id", spaceId).eq("slug", sectionSlug).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapSpaceSectionRow(data);
}

export async function listManageableClasses(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = await listSpacesForUser(profile.id);
  const checks = await Promise.all(
    spaces
      .filter((space) => space.type === "class")
      .map(async (space) => ({
        space,
        memberships: await listMembershipsForSpace(space.id),
      })),
  );

  return checks.filter(({ space, memberships }) => canManageSpace(profile, { space, memberships })).map(({ space }) => space);
}

export async function getManageableClassById(classId: string, profile: AppUserProfile): Promise<SpaceSummary | null> {
  const space = await getSpaceById(classId);

  if (!space || space.type !== "class") {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canManageSpace(profile, { space, memberships })) {
    return null;
  }

  return space;
}

export async function listTeacherVisibleClasses(profile: AppUserProfile): Promise<SpaceSummary[]> {
  if (!isTeacher(profile)) {
    return [];
  }

  return listManageableClasses(profile);
}

export async function listAllClassSpaces(): Promise<SpaceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.filter((space) => space.type === "class");
  }

  const { data, error } = await supabase.from("spaces").select("*").eq("type", "class").order("created_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  return data.map(mapSpaceRow);
}

export async function hasActiveClassMembership(profileId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedMemberships.some((membership) => {
      if (membership.profileId !== profileId || membership.status !== "active" || membership.membershipRole !== "student") {
        return false;
      }

      const space = seedSpaces.find((entry) => entry.id === membership.spaceId);
      return space?.type === "class";
    });
  }

  const { data, error } = await supabase
    .from("space_memberships")
    .select("space_id, spaces!inner(type)")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .eq("membership_role", "student")
    .eq("spaces.type", "class")
    .limit(1);

  if (error) {
    return false;
  }

  return Boolean(data && data.length > 0);
}
