import { canManageSpace, canViewSpace } from "@/lib/permissions/spaces";
import { isSuperAdmin, isTeacher } from "@/lib/permissions/profiles";
import {
  findSectionBySlugForSpaceId,
  findSpaceById,
  findSpaceBySlug,
  listClassSpaces,
  listElectiveSpaces,
  listMembershipsBySpaceId,
  listSectionsBySpaceId,
  listSpacesByProfileId,
  profileHasActiveClassMembership,
} from "@/repositories/space-repository";
import type { AppUserProfile } from "@/types/auth";
import type { SpaceDetail, SpaceMembershipSummary, SpaceSectionSummary, SpaceSummary } from "@/types/domain";

export async function listSpacesForUser(profileId: string): Promise<SpaceSummary[]> {
  return listSpacesByProfileId(profileId);
}

export async function listVisibleSpacesForUser(profile: AppUserProfile): Promise<SpaceSummary[]> {
  if (isSuperAdmin(profile)) {
    const [classes, electives] = await Promise.all([listClassSpaces(), listElectiveSpaces()]);
    return [...classes, ...electives];
  }

  return listSpacesForUser(profile.id);
}

export async function listClassSpacesForUser(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = await listVisibleSpacesForUser(profile);
  return spaces.filter((space) => space.type === "class");
}

export async function getSpaceBySlugForUser(slug: string, profile: AppUserProfile): Promise<SpaceDetail | null> {
  const space = await findSpaceBySlug(slug);

  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  const canSeeSpace =
    isSuperAdmin(profile) ||
    memberships.some((membership) => membership.profileId === profile.id && membership.status === "active") ||
    space.ownerId === profile.id;

  if (!canSeeSpace) {
    return null;
  }

  const sections = await listSectionsForSpace(space.id);
  return { ...space, memberships, sections };
}

export async function getClassSpaceBySlugForUser(slug: string, profile: AppUserProfile): Promise<SpaceDetail | null> {
  const space = await getSpaceBySlugForUser(slug, profile);

  if (!space || space.type !== "class") {
    return null;
  }

  if (!canViewSpace(profile, { space, memberships: space.memberships })) {
    return null;
  }

  return space;
}

export async function listSectionsForSpace(spaceId: string): Promise<SpaceSectionSummary[]> {
  return listSectionsBySpaceId(spaceId);
}

export async function listMembershipsForSpace(spaceId: string): Promise<SpaceMembershipSummary[]> {
  return listMembershipsBySpaceId(spaceId);
}

export async function getSpaceById(spaceId: string): Promise<SpaceSummary | null> {
  return findSpaceById(spaceId);
}

export async function getSectionBySlugForSpace(spaceId: string, sectionSlug: string): Promise<SpaceSectionSummary | null> {
  return findSectionBySlugForSpaceId(spaceId, sectionSlug);
}

export async function listManageableClasses(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const spaces = isSuperAdmin(profile) ? await listClassSpaces() : (await listSpacesForUser(profile.id)).filter((space) => space.type === "class");
  const checks = await Promise.all(
    spaces
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
  return listClassSpaces();
}

export async function listAllElectiveSpaces(): Promise<SpaceSummary[]> {
  return listElectiveSpaces();
}

export async function hasActiveClassMembership(profileId: string): Promise<boolean> {
  return profileHasActiveClassMembership(profileId);
}
