import type { ExerciseItemType, ExerciseSetType } from "@/lib/constants/exercise-types";

const EXERCISE_SET_LABELS: Record<ExerciseSetType, string> = {
  mcq: "MCQ",
  flashcard: "Flashcards",
  term_recall: "Term Recall",
};

const EXERCISE_ITEM_LABELS: Record<ExerciseItemType, string> = {
  mcq: "MCQ",
  flashcard: "Flashcard",
  spelling: "Term Recall",
};

export function getExerciseSetTypeLabel(type: ExerciseSetType) {
  return EXERCISE_SET_LABELS[type];
}

export function getExerciseItemTypeLabel(type: ExerciseItemType) {
  return EXERCISE_ITEM_LABELS[type];
}
