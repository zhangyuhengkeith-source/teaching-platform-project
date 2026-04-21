"use server";

import { revalidatePath } from "next/cache";

import { createExerciseItem, createExerciseSet } from "@/lib/mutations/exercises";
import { requireRole } from "@/lib/auth/require-role";
import { normalizeClassScopedInput } from "@/lib/auth/class-permissions";
import { getManageableClassById } from "@/lib/queries/spaces";
import { createExerciseItemSchema, createExerciseSetSchema } from "@/lib/validations/exercises";

function isCompatibleItemType(exerciseType: "mcq" | "flashcard" | "term_recall", itemType: "mcq" | "flashcard" | "spelling") {
  if (exerciseType === "mcq") {
    return itemType === "mcq";
  }

  if (exerciseType === "flashcard") {
    return itemType === "flashcard";
  }

  return itemType === "spelling";
}

export async function createExerciseSetAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const payload = input as { items?: unknown[] };
  const normalizedInput = normalizeClassScopedInput(input);
  const parsedSet = createExerciseSetSchema.parse(normalizedInput);
  const space = await getManageableClassById(parsedSet.space_id, profile);

  if (!space) {
    throw new Error("You do not have permission to create exercises for this class.");
  }

  const exerciseSet = await createExerciseSet(profile.id, parsedSet);
  const items = Array.isArray(payload.items) ? payload.items : [];

  for (let index = 0; index < items.length; index += 1) {
    const item = (items[index] ?? {}) as Record<string, unknown>;
    const parsedItem = createExerciseItemSchema.parse({
      ...item,
      exercise_set_id: exerciseSet.id,
      sort_order: typeof item.sort_order === "number" ? item.sort_order : index,
    });

    if (!isCompatibleItemType(parsedSet.exercise_type, parsedItem.item_type)) {
      throw new Error("All items in a set must match the exercise type.");
    }

    await createExerciseItem(parsedItem);
  }

  revalidatePath("/admin/exercises");
  revalidatePath(`/classes/${space.slug}`);
  return exerciseSet;
}
