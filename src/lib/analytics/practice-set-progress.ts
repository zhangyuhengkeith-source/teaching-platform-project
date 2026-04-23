import { mapExerciseAttemptRow } from "@/lib/db/mappers";
import { listItemsForExerciseSet } from "@/lib/queries/exercises";
import { listMembershipsForSpace } from "@/lib/queries/spaces";
import { seedExerciseAttempts } from "@/lib/seed/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listClassPracticeSets } from "@/repositories/class-teaching-content-repository";
import { findProfilesByIds } from "@/repositories/profile-repository";
import type {
  ExerciseAttemptSummary,
  ExerciseItemSummary,
  ExerciseSetSummary,
  PracticeSetItemResultStatus,
  PracticeSetProgressMetric,
  PracticeSetProgressSetSummary,
  PracticeSetProgressSummary,
  PracticeSetStudentCompletionStatus,
  ProfileSummary,
} from "@/types/domain";

function emptyMetric(): PracticeSetProgressMetric {
  return {
    completedCount: 0,
    totalCount: 0,
    completionRate: 0,
    correctCount: 0,
    attemptedCount: 0,
    accuracyRate: 0,
  };
}

function toRate(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function buildMetric(completedCount: number, totalCount: number, correctCount: number, attemptedCount: number): PracticeSetProgressMetric {
  return {
    completedCount,
    totalCount,
    completionRate: toRate(completedCount, totalCount),
    correctCount,
    attemptedCount,
    accuracyRate: toRate(correctCount, attemptedCount),
  };
}

function practiceSetSortValue(set: ExerciseSetSummary) {
  return set.publishAt ?? set.updatedAt ?? set.createdAt ?? "";
}

function firstAttemptKey(profileId: string, itemId: string) {
  return `${profileId}:${itemId}`;
}

function getPromptLabel(item: ExerciseItemSummary, index: number) {
  return item.prompt?.trim() || `Question ${index + 1}`;
}

function getStudentName(profile: ProfileSummary | undefined, fallbackId: string) {
  return profile?.displayName ?? profile?.fullName ?? fallbackId;
}

async function listAttemptsForExerciseSets(exerciseSetIds: string[]): Promise<ExerciseAttemptSummary[]> {
  if (exerciseSetIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return seedExerciseAttempts.filter((attempt) => exerciseSetIds.includes(attempt.exerciseSetId));
  }

  const { data, error } = await supabase
    .from("exercise_attempts")
    .select("*")
    .in("exercise_set_id", exerciseSetIds)
    .order("attempt_no", { ascending: true })
    .order("attempted_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(mapExerciseAttemptRow);
}

function getFirstAttempts(attempts: ExerciseAttemptSummary[]) {
  const firstAttempts = new Map<string, ExerciseAttemptSummary>();

  for (const attempt of attempts) {
    const key = firstAttemptKey(attempt.profileId, attempt.itemId);
    const existing = firstAttempts.get(key);

    if (!existing || attempt.attemptNo < existing.attemptNo || (attempt.attemptNo === existing.attemptNo && attempt.attemptedAt < existing.attemptedAt)) {
      firstAttempts.set(key, attempt);
    }
  }

  return firstAttempts;
}

function buildSetProgress({
  attempts,
  items,
  profilesById,
  set,
  studentIds,
}: {
  attempts: ExerciseAttemptSummary[];
  items: ExerciseItemSummary[];
  profilesById: Map<string, ProfileSummary>;
  set: ExerciseSetSummary;
  studentIds: string[];
}): PracticeSetProgressSetSummary {
  const sortedItems = items.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const itemIds = new Set(sortedItems.map((item) => item.id));
  const firstAttempts = getFirstAttempts(
    attempts.filter((attempt) => attempt.exerciseSetId === set.id && studentIds.includes(attempt.profileId) && itemIds.has(attempt.itemId)),
  );
  let completedCount = 0;
  let correctCount = 0;

  const itemStats = sortedItems.map((item, index) => {
    const itemAttempts = studentIds
      .map((studentId) => firstAttempts.get(firstAttemptKey(studentId, item.id)))
      .filter((attempt): attempt is ExerciseAttemptSummary => Boolean(attempt));
    const itemCorrectCount = itemAttempts.filter((attempt) => attempt.isCorrect === true).length;

    completedCount += itemAttempts.length;
    correctCount += itemCorrectCount;

    return {
      itemId: item.id,
      prompt: getPromptLabel(item, index),
      sortOrder: item.sortOrder,
      firstAttemptCount: itemAttempts.length,
      correctCount: itemCorrectCount,
      accuracyRate: toRate(itemCorrectCount, itemAttempts.length),
    };
  });

  const students = studentIds.map((studentId) => {
    const studentItems = sortedItems.map((item, index) => {
      const attempt = firstAttempts.get(firstAttemptKey(studentId, item.id));
      const status: PracticeSetItemResultStatus = !attempt ? "not_started" : attempt.isCorrect === true ? "correct" : "incorrect";

      return {
        itemId: item.id,
        prompt: getPromptLabel(item, index),
        status,
      };
    });
    const studentCompletedCount = studentItems.filter((item) => item.status !== "not_started").length;
    const studentCorrectCount = studentItems.filter((item) => item.status === "correct").length;
    const completionStatus: PracticeSetStudentCompletionStatus =
      studentCompletedCount === 0 ? "not_started" : studentCompletedCount < sortedItems.length ? "in_progress" : "completed";

    return {
      profileId: studentId,
      studentName: getStudentName(profilesById.get(studentId), studentId),
      completionStatus,
      completedCount: studentCompletedCount,
      totalItems: sortedItems.length,
      correctCount: studentCorrectCount,
      accuracyRate: toRate(studentCorrectCount, studentCompletedCount),
      items: studentItems,
    };
  });

  const totalCount = studentIds.length * sortedItems.length;

  return {
    exerciseSetId: set.id,
    title: set.title,
    metric: buildMetric(completedCount, totalCount, correctCount, completedCount),
    itemStats,
    students: students.sort((a, b) => a.studentName.localeCompare(b.studentName)),
  };
}

export async function getPracticeSetProgressSummary(classId: string): Promise<PracticeSetProgressSummary> {
  const [publishedSets, draftSets, memberships] = await Promise.all([
    listClassPracticeSets(classId, { mode: "published" }),
    listClassPracticeSets(classId, { mode: "drafts" }),
    listMembershipsForSpace(classId),
  ]);
  const setsById = new Map([...publishedSets, ...draftSets].map((set) => [set.id, set]));
  const sets = [...setsById.values()].sort((a, b) => practiceSetSortValue(b).localeCompare(practiceSetSortValue(a)));
  const studentIds = memberships
    .filter((membership) => membership.status === "active" && membership.membershipRole === "student")
    .map((membership) => membership.profileId);
  const [profiles, attempts, itemEntries] = await Promise.all([
    findProfilesByIds(studentIds),
    listAttemptsForExerciseSets(sets.map((set) => set.id)),
    Promise.all(sets.map(async (set) => [set.id, await listItemsForExerciseSet(set.id)] as const)),
  ]);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const itemsBySetId = new Map(itemEntries);
  const setProgress = sets.map((set) =>
    buildSetProgress({
      attempts,
      items: itemsBySetId.get(set.id) ?? [],
      profilesById,
      set,
      studentIds,
    }),
  );
  const cumulativeTotals = setProgress.reduce(
    (totals, progress) => ({
      completedCount: totals.completedCount + progress.metric.completedCount,
      totalCount: totals.totalCount + progress.metric.totalCount,
      correctCount: totals.correctCount + progress.metric.correctCount,
      attemptedCount: totals.attemptedCount + progress.metric.attemptedCount,
    }),
    { completedCount: 0, totalCount: 0, correctCount: 0, attemptedCount: 0 },
  );
  const latestSet = sets[0] ?? null;
  const latestProgress = latestSet ? setProgress.find((progress) => progress.exerciseSetId === latestSet.id) ?? null : null;

  return {
    dashboard: {
      cumulative: buildMetric(cumulativeTotals.completedCount, cumulativeTotals.totalCount, cumulativeTotals.correctCount, cumulativeTotals.attemptedCount),
      latest: latestProgress?.metric ?? emptyMetric(),
      latestSetId: latestSet?.id ?? null,
      latestSetTitle: latestSet?.title ?? null,
    },
    sets: setProgress,
  };
}
