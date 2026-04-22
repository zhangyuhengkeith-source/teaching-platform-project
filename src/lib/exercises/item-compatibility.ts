import type { ExerciseItemType, ExerciseSetType } from "@/lib/constants/exercise-types";

export function isCompatibleExerciseItemType(exerciseType: ExerciseSetType, itemType: ExerciseItemType) {
  if (exerciseType === "mcq") {
    return itemType === "mcq";
  }

  if (exerciseType === "flashcard") {
    return itemType === "flashcard";
  }

  return itemType === "spelling";
}
