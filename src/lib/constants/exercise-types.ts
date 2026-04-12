export const EXERCISE_SET_TYPES = ["term_recall", "flashcard", "mcq"] as const;
export const EXERCISE_ITEM_TYPES = ["mcq", "flashcard", "spelling"] as const;
export const FLASHCARD_SELF_EVALUATIONS = ["got_it", "needs_review"] as const;

export type ExerciseSetType = (typeof EXERCISE_SET_TYPES)[number];
export type ExerciseItemType = (typeof EXERCISE_ITEM_TYPES)[number];
export type FlashcardSelfEvaluation = (typeof FLASHCARD_SELF_EVALUATIONS)[number];
