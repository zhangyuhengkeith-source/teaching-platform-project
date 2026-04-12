import {
  mapExerciseAttemptRow,
  mapExerciseItemRow,
  mapExerciseSetRow,
  mapWrongBookItemRow,
} from "@/lib/db/mappers";
import { canManageExerciseSet, canViewExerciseSet, canViewWrongBook } from "@/lib/permissions/exercises";
import { getClassSpaceBySlugForUser, getSpaceById, listMembershipsForSpace, listManageableClasses, listSectionsForSpace } from "@/lib/queries/spaces";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  seedExerciseAttempts,
  seedExerciseItems,
  seedExerciseSets,
  seedSections,
  seedSpaces,
  seedWrongBookItems,
} from "@/lib/seed/seed";
import type { AppUserProfile } from "@/types/auth";
import type {
  ExerciseAttemptSummary,
  ExerciseItemSummary,
  ExerciseSetDetail,
  ExerciseSetSummary,
  WrongBookItemSummary,
} from "@/types/domain";

async function enrichExerciseSet(set: ExerciseSetSummary): Promise<ExerciseSetSummary> {
  const [space, sections] = await Promise.all([getSpaceById(set.spaceId), listSectionsForSpace(set.spaceId)]);
  const section = set.sectionId ? sections.find((entry) => entry.id === set.sectionId) : null;

  return {
    ...set,
    itemCount: set.itemCount ?? (await listItemsForExerciseSet(set.id)).length,
    spaceTitle: set.spaceTitle ?? space?.title,
    spaceSlug: set.spaceSlug ?? space?.slug,
    sectionTitle: set.sectionTitle ?? section?.title ?? null,
    sectionSlug: set.sectionSlug ?? section?.slug ?? null,
  };
}

async function loadExerciseSetAccessContext(profile: AppUserProfile, set: ExerciseSetSummary) {
  const space = seedSpaces.find((entry) => entry.id === set.spaceId);

  if (!space) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  return { space, memberships };
}

export async function listItemsForExerciseSet(exerciseSetId: string): Promise<ExerciseItemSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedExerciseItems
      .filter((item) => item.exerciseSetId === exerciseSetId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const { data, error } = await supabase.from("exercise_items").select("*").eq("exercise_set_id", exerciseSetId).order("sort_order");
  if (error || !data) {
    return [];
  }

  return data.map(mapExerciseItemRow);
}

export async function getExerciseItemById(itemId: string): Promise<ExerciseItemSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedExerciseItems.find((item) => item.id === itemId) ?? null;
  }

  const { data, error } = await supabase.from("exercise_items").select("*").eq("id", itemId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapExerciseItemRow(data);
}

export async function getExerciseSetById(exerciseSetId: string): Promise<ExerciseSetSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const set = seedExerciseSets.find((entry) => entry.id === exerciseSetId) ?? null;
    return set ? enrichExerciseSet(set) : null;
  }

  const { data, error } = await supabase.from("exercise_sets").select("*").eq("id", exerciseSetId).maybeSingle();
  if (error || !data) {
    return null;
  }

  return enrichExerciseSet(mapExerciseSetRow(data));
}

async function listExerciseSetsRawBySpace(spaceId: string): Promise<ExerciseSetSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Promise.all(seedExerciseSets.filter((set) => set.spaceId === spaceId).map(enrichExerciseSet));
  }

  const { data, error } = await supabase.from("exercise_sets").select("*").eq("space_id", spaceId).order("updated_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  return Promise.all(data.map((row) => enrichExerciseSet(mapExerciseSetRow(row))));
}

export async function listExerciseSetsForSpace(spaceId: string, profile?: AppUserProfile): Promise<ExerciseSetSummary[]> {
  const sets = await listExerciseSetsRawBySpace(spaceId);

  if (!profile) {
    return sets.filter((set) => set.status === "published");
  }

  const space = seedSpaces.find((entry) => entry.id === spaceId);
  if (!space) {
    return [];
  }

  const memberships = await listMembershipsForSpace(spaceId);

  return sets.filter((exerciseSet) => canViewExerciseSet(profile, { exerciseSet, space, memberships }));
}

export async function listExerciseSetsForSection(sectionId: string, profile?: AppUserProfile): Promise<ExerciseSetSummary[]> {
  const supabase = await createSupabaseServerClient();
  const section = !supabase
    ? seedSections.find((entry) => entry.id === sectionId) ?? null
    : await supabase
        .from("space_sections")
        .select("space_id")
        .eq("id", sectionId)
        .maybeSingle()
        .then(({ data, error }) => (error || !data ? null : { id: sectionId, spaceId: data.space_id }));

  if (!section) {
    return [];
  }

  const sets = (await listExerciseSetsForSpace(section.spaceId, profile)).filter((set) => set.sectionId === sectionId);
  return sets.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getExerciseSetBySlugForUser(spaceSlug: string, exerciseSlug: string, profile: AppUserProfile): Promise<ExerciseSetSummary | null> {
  const space = await getClassSpaceBySlugForUser(spaceSlug, profile);
  if (!space) {
    return null;
  }

  const exerciseSet = (await listExerciseSetsRawBySpace(space.id)).find((set) => set.slug === exerciseSlug) ?? null;
  if (!exerciseSet) {
    return null;
  }

  const memberships = await listMembershipsForSpace(space.id);
  if (!canViewExerciseSet(profile, { exerciseSet, space, memberships })) {
    return null;
  }

  return exerciseSet;
}

export async function getExerciseSetWithItemsForUser(spaceSlug: string, exerciseSlug: string, profile: AppUserProfile): Promise<ExerciseSetDetail | null> {
  const exerciseSet = await getExerciseSetBySlugForUser(spaceSlug, exerciseSlug, profile);
  if (!exerciseSet) {
    return null;
  }

  const items = await listItemsForExerciseSet(exerciseSet.id);
  const latestAttempts = await listAttemptsForUserAndSet(profile.id, exerciseSet.id);
  const [space, sections] = await Promise.all([getSpaceById(exerciseSet.spaceId), listSectionsForSpace(exerciseSet.spaceId)]);
  const section = exerciseSet.sectionId ? sections.find((entry) => entry.id === exerciseSet.sectionId) ?? null : null;

  return {
    ...exerciseSet,
    items,
    latestAttempts,
    space: space ?? undefined,
    section,
  };
}

export async function listManageableExerciseSets(profile: AppUserProfile): Promise<ExerciseSetSummary[]> {
  const classes = await listManageableClasses(profile);
  const allSets = (await Promise.all(classes.map((space) => listExerciseSetsRawBySpace(space.id)))).flat();

  return allSets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getManageableExerciseSetById(exerciseSetId: string, profile: AppUserProfile): Promise<ExerciseSetDetail | null> {
  const set = await getExerciseSetById(exerciseSetId);
  if (!set) {
    return null;
  }

  const context = await loadExerciseSetAccessContext(profile, set);
  if (!context || !canManageExerciseSet(profile, { exerciseSet: set, space: context.space, memberships: context.memberships })) {
    return null;
  }

  return {
    ...set,
    items: await listItemsForExerciseSet(set.id),
    space: context.space,
    section: set.sectionId ? (await listSectionsForSpace(context.space.id)).find((entry) => entry.id === set.sectionId) ?? null : null,
  };
}

export async function listAttemptsForUserAndSet(profileId: string, exerciseSetId: string): Promise<ExerciseAttemptSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedExerciseAttempts
      .filter((attempt) => attempt.profileId === profileId && attempt.exerciseSetId === exerciseSetId)
      .sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
  }

  const { data, error } = await supabase
    .from("exercise_attempts")
    .select("*")
    .eq("profile_id", profileId)
    .eq("exercise_set_id", exerciseSetId)
    .order("attempted_at");

  if (error || !data) {
    return [];
  }

  return data.map(mapExerciseAttemptRow);
}

export async function getLatestAttemptForUserAndItem(profileId: string, itemId: string): Promise<ExerciseAttemptSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedExerciseAttempts
      .filter((attempt) => attempt.profileId === profileId && attempt.itemId === itemId)
      .sort((a, b) => b.attemptNo - a.attemptNo)[0] ?? null;
  }

  const { data, error } = await supabase
    .from("exercise_attempts")
    .select("*")
    .eq("profile_id", profileId)
    .eq("item_id", itemId)
    .order("attempt_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapExerciseAttemptRow(data);
}

async function listWrongBookItemsRawForUser(profileId: string): Promise<WrongBookItemSummary[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedWrongBookItems.filter((item) => item.profileId === profileId);
  }

  const { data, error } = await supabase
    .from("wrong_book_items")
    .select("*")
    .eq("profile_id", profileId)
    .order("latest_wrong_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapWrongBookItemRow);
}

async function enrichWrongBookItem(item: WrongBookItemSummary): Promise<WrongBookItemSummary> {
  const sourceItem = await getExerciseItemById(item.sourceId);
  const exerciseSet = sourceItem ? await getExerciseSetById(sourceItem.exerciseSetId) : null;
  const [space, sections] = exerciseSet
    ? await Promise.all([getSpaceById(exerciseSet.spaceId), listSectionsForSpace(exerciseSet.spaceId)])
    : [null, []];
  const section = exerciseSet?.sectionId ? sections.find((entry) => entry.id === exerciseSet.sectionId) ?? null : null;
  const latestAttempt = sourceItem ? await getLatestAttemptForUserAndItem(item.profileId, sourceItem.id) : null;

  return {
    ...item,
    sourceItem,
    exerciseSet,
    space,
    section,
    latestAttempt,
  };
}

export async function listWrongBookItemsForUser(profile: AppUserProfile): Promise<WrongBookItemSummary[]> {
  if (!canViewWrongBook(profile, profile.id)) {
    return [];
  }

  const items = await listWrongBookItemsRawForUser(profile.id);
  return Promise.all(items.map(enrichWrongBookItem));
}

export async function listActiveWrongBookItemsForUser(profile: AppUserProfile): Promise<WrongBookItemSummary[]> {
  const items = await listWrongBookItemsForUser(profile);
  return items.filter((item) => item.status === "active");
}

export async function listMasteredWrongBookItemsForUser(profile: AppUserProfile): Promise<WrongBookItemSummary[]> {
  const items = await listWrongBookItemsForUser(profile);
  return items.filter((item) => item.status === "mastered");
}

export async function getWrongBookItemDetailForUser(profile: AppUserProfile, wrongBookItemId: string): Promise<WrongBookItemSummary | null> {
  const items = await listWrongBookItemsForUser(profile);
  return items.find((item) => item.id === wrongBookItemId) ?? null;
}
