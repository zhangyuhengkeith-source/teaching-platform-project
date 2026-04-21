import { getClassSubjectLabelFromSlug } from "@/lib/constants/class-subjects";
import { isAdminRole } from "@/lib/permissions/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedMemberships, seedResources, seedSpaces } from "@/lib/seed/seed";
import { mapSpaceRow } from "@/lib/db/mappers";
import type { AppUserProfile } from "@/types/auth";
import type { AdminClassCardSummary, SpaceSummary } from "@/types/domain";

function canIncludeClassForAdminHome(profile: AppUserProfile, space: SpaceSummary) {
  if (space.type !== "class") {
    return false;
  }

  if (isAdminRole(profile)) {
    return true;
  }

  if ((space.approvalStatus === "pending" || space.approvalStatus === "rejected") && (space.createdBy ?? space.ownerId) === profile.id) {
    return true;
  }

  if (space.approvalStatus && space.approvalStatus !== "approved") {
    return false;
  }

  return (
    space.ownerId === profile.id ||
    seedMemberships.some(
      (membership) =>
        membership.spaceId === space.id &&
        membership.profileId === profile.id &&
        membership.status === "active" &&
        (membership.membershipRole === "teacher" || membership.membershipRole === "assistant"),
    )
  );
}

async function listClassSpacesForAdminHome(profile: AppUserProfile): Promise<SpaceSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedSpaces.filter((space) => canIncludeClassForAdminHome(profile, { approvalStatus: "approved", createdBy: space.ownerId, ...space }));
  }

  const { data: teachingMemberships } = await supabase
    .from("space_memberships")
    .select("space_id")
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .in("membership_role", ["teacher", "assistant"]);

  const membershipSpaceIds = teachingMemberships?.map((membership) => membership.space_id) ?? [];

  let query = supabase.from("spaces").select("*").eq("type", "class").order("updated_at", { ascending: false });

  if (!isAdminRole(profile)) {
    const accessibleIds = membershipSpaceIds.length > 0 ? membershipSpaceIds.join(",") : "00000000-0000-0000-0000-000000000000";
    query = query.or(`owner_id.eq.${profile.id},created_by.eq.${profile.id},id.in.(${accessibleIds})`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  const mapped = data.map(mapSpaceRow);
  return mapped.filter((space) => {
    if (isAdminRole(profile)) {
      return true;
    }

    if ((space.approvalStatus === "pending" || space.approvalStatus === "rejected") && (space.createdBy ?? space.ownerId) === profile.id) {
      return true;
    }

    return (space.approvalStatus ?? "approved") === "approved";
  });
}

async function getClassStats(spaceId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const activeMemberships = seedMemberships.filter((membership) => membership.spaceId === spaceId && membership.status === "active");
    const latestResourceUpdatedAt =
      seedResources
        .filter((resource) => resource.spaceId === spaceId)
        .map((resource) => resource.updatedAt ?? null)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;

    return {
      studentCount: activeMemberships.filter((membership) => membership.membershipRole === "student").length,
      teacherCount: activeMemberships.filter((membership) => membership.membershipRole === "teacher" || membership.membershipRole === "assistant").length,
      latestResourceUpdatedAt,
    };
  }

  const [membershipsResult, resourcesResult] = await Promise.all([
    supabase.from("space_memberships").select("membership_role").eq("space_id", spaceId).eq("status", "active"),
    supabase.from("resources").select("updated_at").eq("space_id", spaceId).order("updated_at", { ascending: false }).limit(1),
  ]);

  const memberships = membershipsResult.data ?? [];
  return {
    studentCount: memberships.filter((membership) => membership.membership_role === "student").length,
    teacherCount: memberships.filter((membership) => membership.membership_role === "teacher" || membership.membership_role === "assistant").length,
    latestResourceUpdatedAt: resourcesResult.data?.[0]?.updated_at ?? null,
  };
}

export async function listAdminClassCards(profile: AppUserProfile): Promise<AdminClassCardSummary[]> {
  const classes = await listClassSpacesForAdminHome(profile);
  const cards = await Promise.all(
    classes.map(async (space) => ({
      ...space,
      approvalStatus: space.approvalStatus ?? "approved",
      createdBy: space.createdBy ?? space.ownerId,
      subjectLabel: getClassSubjectLabelFromSlug(space.slug),
      ...(await getClassStats(space.id)),
    })),
  );

  return cards.sort((a, b) => {
    const aPriority = a.approvalStatus === "pending" ? 0 : a.approvalStatus === "rejected" ? 1 : 2;
    const bPriority = b.approvalStatus === "pending" ? 0 : b.approvalStatus === "rejected" ? 1 : 2;
    return aPriority - bPriority || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  });
}
