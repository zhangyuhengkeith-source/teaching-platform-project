import type { ExerciseItemType, ExerciseSetType } from "@/lib/constants/exercise-types";
import type { TranslationKey } from "@/lib/i18n/types";

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

const EXERCISE_SET_LABEL_KEYS: Record<ExerciseSetType, TranslationKey> = {
  mcq: "practice.types.mcq",
  flashcard: "practice.types.flashcard",
  term_recall: "practice.types.termRecall",
};

const EXERCISE_ITEM_LABEL_KEYS: Record<ExerciseItemType, TranslationKey> = {
  mcq: "practice.itemTypes.mcq",
  flashcard: "practice.itemTypes.flashcard",
  spelling: "practice.itemTypes.spelling",
};

export function getExerciseSetTypeLabelKey(type: ExerciseSetType) {
  return EXERCISE_SET_LABEL_KEYS[type];
}

export function getExerciseItemTypeLabelKey(type: ExerciseItemType) {
  return EXERCISE_ITEM_LABEL_KEYS[type];
}

export function getExerciseSetTypeLabel(type: ExerciseSetType) {
  return EXERCISE_SET_LABELS[type];
}

export function getExerciseItemTypeLabel(type: ExerciseItemType) {
  return EXERCISE_ITEM_LABELS[type];
}
