import { gradeExerciseSubmission, isWrongBookEligible } from "@/lib/exercises/grading";
import {
  mapExerciseAttemptRow,
  mapExerciseItemRow,
  mapExerciseSetRow,
  mapWrongBookItemRow,
} from "@/lib/db/mappers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submittedAnswerSchemaForItemType } from "@/lib/validations/exercises";
import {
  seedExerciseAttempts,
  seedExerciseItems,
  seedExerciseSets,
  seedWrongBookItems,
} from "@/lib/seed/seed";
import type {
  CreateExerciseItemInput,
  CreateExerciseSetInput,
  RetryWrongBookItemInput,
  SubmitExerciseAttemptInput,
  UpdateExerciseItemInput,
  UpdateExerciseSetInput,
} from "@/types/api";
import type { Json } from "@/types/database";
import type {
  ExerciseAttemptSummary,
  ExerciseItemSummary,
  ExerciseSetSummary,
  PracticeSubmissionResult,
  WrongBookItemSummary,
} from "@/types/domain";
import { getExerciseItemById, getExerciseSetById, getLatestAttemptForUserAndItem, getWrongBookItemDetailForUser } from "@/lib/queries/exercises";
import type { AppUserProfile } from "@/types/auth";

function nowIso() {
  return new Date().toISOString();
}

function getSeedWrongBookItem(profileId: string, sourceId: string) {
  return seedWrongBookItems.find((item) => item.profileId === profileId && item.sourceType === "exercise_item" && item.sourceId === sourceId) ?? null;
}

export async function createExerciseSet(createdBy: string, input: CreateExerciseSetInput): Promise<ExerciseSetSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const created: ExerciseSetSummary = {
      id: crypto.randomUUID(),
      spaceId: input.space_id,
      sectionId: input.section_id ?? null,
      title: input.title,
      slug: input.slug,
      exerciseType: input.exercise_type,
      instructions: input.instructions ?? null,
      status: input.status,
      createdBy,
      updatedBy: createdBy,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      itemCount: 0,
    };

    seedExerciseSets.unshift(created);
    return created;
  }

  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      space_id: input.space_id,
      section_id: input.section_id ?? null,
      title: input.title,
      slug: input.slug,
      exercise_type: input.exercise_type,
      instructions: input.instructions ?? null,
      status: input.status,
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create exercise set.");
  }

  return mapExerciseSetRow(data, 0);
}

export async function updateExerciseSet(updatedBy: string, input: UpdateExerciseSetInput): Promise<ExerciseSetSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const existing = seedExerciseSets.find((set) => set.id === input.id);
    if (!existing) {
      throw new Error("Exercise set not found.");
    }

    Object.assign(existing, {
      spaceId: input.space_id ?? existing.spaceId,
      sectionId: input.section_id ?? existing.sectionId,
      title: input.title ?? existing.title,
      slug: input.slug ?? existing.slug,
      exerciseType: input.exercise_type ?? existing.exerciseType,
      instructions: input.instructions ?? existing.instructions,
      status: input.status ?? existing.status,
      updatedBy,
      updatedAt: nowIso(),
    });

    return existing;
  }

  const { data, error } = await supabase
    .from("exercise_sets")
    .update({
      space_id: input.space_id,
      section_id: input.section_id,
      title: input.title,
      slug: input.slug,
      exercise_type: input.exercise_type,
      instructions: input.instructions,
      status: input.status,
      updated_by: updatedBy,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update exercise set.");
  }

  const itemCount = (await listItemsForSetCount(data.id, supabase)) ?? 0;
  return mapExerciseSetRow(data, itemCount);
}

async function listItemsForSetCount(exerciseSetId: string, supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  if (!supabase) {
    return seedExerciseItems.filter((item) => item.exerciseSetId === exerciseSetId).length;
  }

  const { count } = await supabase.from("exercise_items").select("*", { count: "exact", head: true }).eq("exercise_set_id", exerciseSetId);
  return count ?? 0;
}

export async function createExerciseItem(input: CreateExerciseItemInput): Promise<ExerciseItemSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const created: ExerciseItemSummary = {
      id: crypto.randomUUID(),
      exerciseSetId: input.exercise_set_id,
      prompt: input.prompt,
      promptRich: input.prompt_rich ?? null,
      itemType: input.item_type,
      answerKey: input.answer_key_json,
      explanation: input.explanation ?? null,
      sortOrder: input.sort_order ?? 0,
      difficulty: input.difficulty ?? null,
      tags: input.tags_json ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    seedExerciseItems.push(created);
    return created;
  }

  const { data, error } = await supabase
    .from("exercise_items")
      .insert({
        exercise_set_id: input.exercise_set_id,
        prompt: input.prompt,
        prompt_rich: input.prompt_rich ?? null,
        item_type: input.item_type,
        answer_key_json: input.answer_key_json as unknown as Json,
        explanation: input.explanation ?? null,
        sort_order: input.sort_order ?? 0,
        difficulty: input.difficulty ?? null,
        tags_json: (input.tags_json ?? null) as unknown as Json,
      })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create exercise item.");
  }

  return mapExerciseItemRow(data);
}

export async function updateExerciseItem(input: UpdateExerciseItemInput): Promise<ExerciseItemSummary> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const existing = seedExerciseItems.find((item) => item.id === input.id);
    if (!existing) {
      throw new Error("Exercise item not found.");
    }

    Object.assign(existing, {
      exerciseSetId: input.exercise_set_id ?? existing.exerciseSetId,
      prompt: input.prompt ?? existing.prompt,
      promptRich: input.prompt_rich ?? existing.promptRich,
      itemType: input.item_type ?? existing.itemType,
      answerKey: input.answer_key_json ?? existing.answerKey,
      explanation: input.explanation ?? existing.explanation,
      sortOrder: input.sort_order ?? existing.sortOrder,
      difficulty: input.difficulty ?? existing.difficulty,
      tags: input.tags_json ?? existing.tags,
      updatedAt: nowIso(),
    });

    return existing;
  }

  const { data, error } = await supabase
    .from("exercise_items")
    .update({
      exercise_set_id: input.exercise_set_id,
      prompt: input.prompt,
      prompt_rich: input.prompt_rich,
      item_type: input.item_type,
      answer_key_json: input.answer_key_json as unknown as Json,
      explanation: input.explanation,
      sort_order: input.sort_order,
      difficulty: input.difficulty,
      tags_json: (input.tags_json ?? null) as unknown as Json,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update exercise item.");
  }

  return mapExerciseItemRow(data);
}

export async function replaceExerciseItemsForSet(exerciseSetId: string, items: CreateExerciseItemInput[]) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    for (let index = seedExerciseItems.length - 1; index >= 0; index -= 1) {
      if (seedExerciseItems[index]?.exerciseSetId === exerciseSetId) {
        seedExerciseItems.splice(index, 1);
      }
    }

    const created = items.map((item, index) => ({
      id: crypto.randomUUID(),
      exerciseSetId,
      prompt: item.prompt,
      promptRich: item.prompt_rich ?? null,
      itemType: item.item_type,
      answerKey: item.answer_key_json,
      explanation: item.explanation ?? null,
      sortOrder: item.sort_order ?? index,
      difficulty: item.difficulty ?? null,
      tags: item.tags_json ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    } satisfies ExerciseItemSummary));

    seedExerciseItems.push(...created);
    const set = seedExerciseSets.find((entry) => entry.id === exerciseSetId);
    if (set) {
      set.itemCount = created.length;
      set.updatedAt = nowIso();
    }
    return created;
  }

  const { error: deleteError } = await supabase.from("exercise_items").delete().eq("exercise_set_id", exerciseSetId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (items.length === 0) {
    return [];
  }

  const payload = items.map((item, index) => ({
    exercise_set_id: exerciseSetId,
    prompt: item.prompt,
    prompt_rich: item.prompt_rich ?? null,
    item_type: item.item_type,
    answer_key_json: item.answer_key_json as unknown as Json,
    explanation: item.explanation ?? null,
    sort_order: item.sort_order ?? index,
    difficulty: item.difficulty ?? null,
    tags_json: (item.tags_json ?? null) as unknown as Json,
  }));

  const { data, error } = await supabase.from("exercise_items").insert(payload).select("*").order("sort_order");
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to replace exercise items.");
  }

  return data.map(mapExerciseItemRow);
}

async function getWrongBookItemBySource(profileId: string, sourceId: string): Promise<WrongBookItemSummary | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return getSeedWrongBookItem(profileId, sourceId);
  }

  const { data, error } = await supabase
    .from("wrong_book_items")
    .select("*")
    .eq("profile_id", profileId)
    .eq("source_type", "exercise_item")
    .eq("source_id", sourceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapWrongBookItemRow(data);
}

export async function createOrUpdateWrongBookItemFromAttempt(
  profileId: string,
  item: ExerciseItemSummary,
  attempt: ExerciseAttemptSummary,
): Promise<WrongBookItemSummary> {
  const supabase = await createSupabaseServerClient();
  const existing = await getWrongBookItemBySource(profileId, item.id);

  if (!supabase) {
    if (existing) {
      Object.assign(existing, {
        latestAttemptId: attempt.id,
        latestWrongAt: attempt.attemptedAt,
        masteredAt: null,
        status: "active",
      });
      return existing;
    }

    const created: WrongBookItemSummary = {
      id: crypto.randomUUID(),
      profileId,
      sourceType: "exercise_item",
      sourceId: item.id,
      latestAttemptId: attempt.id,
      firstWrongAt: attempt.attemptedAt,
      latestWrongAt: attempt.attemptedAt,
      masteredAt: null,
      status: "active",
    };
    seedWrongBookItems.unshift(created);
    return created;
  }

  const { data, error } = await supabase
    .from("wrong_book_items")
    .upsert(
      {
        id: existing?.id,
        profile_id: profileId,
        source_type: "exercise_item",
        source_id: item.id,
        latest_attempt_id: attempt.id,
        first_wrong_at: existing?.firstWrongAt ?? attempt.attemptedAt,
        latest_wrong_at: attempt.attemptedAt,
        mastered_at: null,
        status: "active",
      },
      { onConflict: "profile_id,source_type,source_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update wrong-book.");
  }

  return mapWrongBookItemRow(data);
}

export async function markWrongBookItemMastered(profileId: string, itemId: string, attempt: ExerciseAttemptSummary): Promise<WrongBookItemSummary | null> {
  const supabase = await createSupabaseServerClient();
  const existing = await getWrongBookItemBySource(profileId, itemId);

  if (!existing) {
    return null;
  }

  if (!supabase) {
    Object.assign(existing, {
      latestAttemptId: attempt.id,
      masteredAt: attempt.attemptedAt,
      status: "mastered",
    });
    return existing;
  }

  const { data, error } = await supabase
    .from("wrong_book_items")
    .update({
      latest_attempt_id: attempt.id,
      mastered_at: attempt.attemptedAt,
      status: "mastered",
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to mark wrong-book item as mastered.");
  }

  return mapWrongBookItemRow(data);
}

export async function submitExerciseAttempt(profileId: string, input: SubmitExerciseAttemptInput): Promise<PracticeSubmissionResult> {
  const [exerciseSet, item, latestAttempt] = await Promise.all([
    getExerciseSetById(input.exercise_set_id),
    getExerciseItemById(input.item_id),
    getLatestAttemptForUserAndItem(profileId, input.item_id),
  ]);

  if (!exerciseSet || !item || item.exerciseSetId !== exerciseSet.id) {
    throw new Error("Exercise item or set could not be found.");
  }

  const validatedAnswer = submittedAnswerSchemaForItemType(item.itemType).parse(input.submitted_answer_json);
  const graded = gradeExerciseSubmission(item, validatedAnswer);
  const supabase = await createSupabaseServerClient();
  const attemptNo = (latestAttempt?.attemptNo ?? 0) + 1;

  let attempt: ExerciseAttemptSummary;

  if (!supabase) {
    attempt = {
      id: crypto.randomUUID(),
      exerciseSetId: exerciseSet.id,
      itemId: item.id,
      profileId,
      submittedAnswer: graded.normalizedAnswer,
      isCorrect: graded.isCorrect,
      score: graded.score,
      attemptNo,
      attemptedAt: nowIso(),
    };
    seedExerciseAttempts.push(attempt);
  } else {
    const { data, error } = await supabase
      .from("exercise_attempts")
      .insert({
        exercise_set_id: exerciseSet.id,
        item_id: item.id,
        profile_id: profileId,
        submitted_answer_json: graded.normalizedAnswer as unknown as Json,
        is_correct: graded.isCorrect,
        score: graded.score,
        attempt_no: attemptNo,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to store exercise attempt.");
    }

    attempt = mapExerciseAttemptRow(data);
  }

  let wrongBookStatus: PracticeSubmissionResult["wrongBookStatus"] = null;

  if (isWrongBookEligible(item)) {
    if (graded.isCorrect) {
      const mastered = await markWrongBookItemMastered(profileId, item.id, attempt);
      wrongBookStatus = mastered?.status ?? null;
    } else {
      const wrongBookItem = await createOrUpdateWrongBookItemFromAttempt(profileId, item, attempt);
      wrongBookStatus = wrongBookItem.status;
    }
  }

  return {
    ...graded,
    attempt,
    wrongBookStatus,
  };
}

export async function retryWrongBookItem(profile: AppUserProfile, input: RetryWrongBookItemInput): Promise<PracticeSubmissionResult> {
  const wrongBookItem = await getWrongBookItemDetailForUser(profile, input.wrong_book_item_id);

  if (!wrongBookItem?.sourceItem || !wrongBookItem.exerciseSet) {
    throw new Error("Wrong-book entry could not be found.");
  }

  return submitExerciseAttempt(profile.id, {
    exercise_set_id: wrongBookItem.exerciseSet.id,
    item_id: wrongBookItem.sourceItem.id,
    submitted_answer_json: input.submitted_answer_json,
  });
}
