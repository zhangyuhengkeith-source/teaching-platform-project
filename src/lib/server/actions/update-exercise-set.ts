"use server";

import { revalidatePath } from "next/cache";

import { replaceExerciseItemsForSet, updateExerciseSet } from "@/lib/mutations/exercises";
import { requireRole } from "@/lib/auth/require-role";
import { getManageableClassById } from "@/lib/queries/spaces";
import { createExerciseItemSchema, updateExerciseSetSchema } from "@/lib/validations/exercises";
import { getManageableExerciseSetById } from "@/lib/queries/exercises";

function isCompatibleItemType(exerciseType: "mcq" | "flashcard" | "term_recall", itemType: "mcq" | "flashcard" | "spelling") {
  if (exerciseType === "mcq") {
    return itemType === "mcq";
  }

  if (exerciseType === "flashcard") {
    return itemType === "flashcard";
  }

  return itemType === "spelling";
}

export async function updateExerciseSetAction(input: unknown) {
  const profile = await requireRole(["super_admin", "teacher"]);
  const payload = input as { items?: unknown[] };
  const parsedSet = updateExerciseSetSchema.parse(input);
  const existingSet = await getManageableExerciseSetById(parsedSet.id, profile);

  if (!existingSet) {
    throw new Error("You do not have permission to update this exercise set.");
  }

  const targetSpaceId = parsedSet.space_id ?? existingSet.spaceId;
  const targetSpace = await getManageableClassById(targetSpaceId, profile);
  if (!targetSpace) {
    throw new Error("You do not have permission to move this exercise set to that class.");
  }

  const updatedSet = await updateExerciseSet(profile.id, parsedSet);
  const items = Array.isArray(payload.items) ? payload.items : [];
  const parsedItems = items.map((rawItem, index) => {
    const item = (rawItem ?? {}) as Record<string, unknown>;
    return (
    createExerciseItemSchema.parse({
      ...item,
      exercise_set_id: updatedSet.id,
      sort_order: typeof item.sort_order === "number" ? item.sort_order : index,
    })
    );
  });

  if (!parsedItems.every((item) => isCompatibleItemType(updatedSet.exerciseType, item.item_type))) {
    throw new Error("All items in a set must match the exercise type.");
  }

  await replaceExerciseItemsForSet(updatedSet.id, parsedItems);

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${updatedSet.id}/edit`);
  revalidatePath(`/classes/${targetSpace.slug}`);
  return updatedSet;
}
