"use server";

import { revalidatePath } from "next/cache";

import { submitExerciseAttempt } from "@/lib/mutations/exercises";
import { requireAuth } from "@/lib/auth/require-auth";
import { canSubmitExerciseAttempt } from "@/lib/permissions/exercises";
import { getExerciseSetById } from "@/lib/queries/exercises";
import { getSpaceById, listMembershipsForSpace } from "@/lib/queries/spaces";
import { submitExerciseAttemptSchema, submittedAnswerSchemaForItemType } from "@/lib/validations/exercises";
import { getExerciseItemById } from "@/lib/queries/exercises";

export async function submitExerciseAttemptAction(input: unknown) {
  const profile = await requireAuth();
  const parsed = submitExerciseAttemptSchema.parse(input);
  const [exerciseSet, item] = await Promise.all([getExerciseSetById(parsed.exercise_set_id), getExerciseItemById(parsed.item_id)]);

  if (!exerciseSet || !item || item.exerciseSetId !== exerciseSet.id) {
    throw new Error("Exercise item or set could not be found.");
  }

  const space = await getSpaceById(exerciseSet.spaceId);
  const memberships = space ? await listMembershipsForSpace(space.id) : [];
  if (!space || !canSubmitExerciseAttempt(profile, { exerciseSet, space, memberships })) {
    throw new Error("You do not have access to this exercise set.");
  }

  const normalizedInput = {
    ...parsed,
    submitted_answer_json: submittedAnswerSchemaForItemType(item.itemType).parse(parsed.submitted_answer_json),
  };

  const result = await submitExerciseAttempt(profile.id, normalizedInput);
  revalidatePath("/wrong-book");
  revalidatePath(`/classes/${space.slug}/practice/${exerciseSet.slug}`);
  return result;
}
