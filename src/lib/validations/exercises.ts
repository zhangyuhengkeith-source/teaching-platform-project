import { z } from "zod";

import { EXERCISE_ITEM_TYPES, EXERCISE_SET_TYPES, FLASHCARD_SELF_EVALUATIONS } from "@/lib/constants/exercise-types";
import { EXERCISE_SET_STATUSES } from "@/lib/constants/statuses";
import type { ExerciseItemType } from "@/lib/constants/exercise-types";

const uuidField = z.string().uuid("A valid UUID is required.");
const slugField = z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens.");

export const mcqOptionSchema = z.object({
  id: z.string().trim().min(1, "Option id is required."),
  label: z.string().trim().min(1, "Option label is required."),
});

export const mcqAnswerKeySchema = z
  .object({
    options: z.array(mcqOptionSchema).min(2, "At least two options are required."),
    correctOptionId: z.string().trim().min(1, "Choose the correct option."),
  })
  .superRefine((value, ctx) => {
    const optionIds = new Set<string>();

    value.options.forEach((option, index) => {
      if (optionIds.has(option.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options", index, "id"],
          message: "Option ids must be unique.",
        });
      }

      optionIds.add(option.id);
    });

    if (!optionIds.has(value.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctOptionId"],
        message: "Correct option must match one of the option ids.",
      });
    }
  });

export const flashcardAnswerKeySchema = z.object({
  front: z.string().trim().min(1, "Flashcard front is required."),
  back: z.string().trim().min(1, "Flashcard back is required."),
});

export const recallAnswerKeySchema = z.object({
  acceptedAnswers: z.array(z.string().trim().min(1, "Accepted answer cannot be empty.")).min(1, "Add at least one accepted answer."),
});

export const createExerciseSetSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: slugField,
  exercise_type: z.enum(EXERCISE_SET_TYPES),
  instructions: z.string().trim().optional().nullable(),
  status: z.enum(EXERCISE_SET_STATUSES),
  space_id: uuidField,
  section_id: z.preprocess((value) => (value === "" ? null : value), uuidField.optional().nullable()),
});

export const updateExerciseSetSchema = createExerciseSetSchema.partial().extend({
  id: uuidField,
});

const exerciseItemCommonSchema = {
  prompt: z.string().trim().min(1, "Prompt is required."),
  prompt_rich: z.string().trim().optional().nullable(),
  explanation: z.string().trim().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  difficulty: z.string().trim().optional().nullable(),
  tags_json: z.array(z.string().trim().min(1)).optional().nullable(),
};

export const createExerciseItemSchema = z.discriminatedUnion("item_type", [
  z.object({
    exercise_set_id: uuidField,
    item_type: z.literal("mcq"),
    answer_key_json: mcqAnswerKeySchema,
    ...exerciseItemCommonSchema,
  }),
  z.object({
    exercise_set_id: uuidField,
    item_type: z.literal("flashcard"),
    answer_key_json: flashcardAnswerKeySchema,
    ...exerciseItemCommonSchema,
  }),
  z.object({
    exercise_set_id: uuidField,
    item_type: z.literal("spelling"),
    answer_key_json: recallAnswerKeySchema,
    ...exerciseItemCommonSchema,
  }),
]);

export const exerciseItemEditorSchema = z.discriminatedUnion("item_type", [
  z.object({
    item_type: z.literal("mcq"),
    answer_key_json: mcqAnswerKeySchema,
    ...exerciseItemCommonSchema,
  }),
  z.object({
    item_type: z.literal("flashcard"),
    answer_key_json: flashcardAnswerKeySchema,
    ...exerciseItemCommonSchema,
  }),
  z.object({
    item_type: z.literal("spelling"),
    answer_key_json: recallAnswerKeySchema,
    ...exerciseItemCommonSchema,
  }),
]);

export const updateExerciseItemSchema = z.discriminatedUnion("item_type", [
  z.object({
    id: uuidField,
    exercise_set_id: uuidField.optional(),
    item_type: z.literal("mcq"),
    answer_key_json: mcqAnswerKeySchema.optional(),
    prompt: z.string().trim().min(1).optional(),
    prompt_rich: z.string().trim().optional().nullable(),
    explanation: z.string().trim().optional().nullable(),
    sort_order: z.number().int().min(0).optional(),
    difficulty: z.string().trim().optional().nullable(),
    tags_json: z.array(z.string().trim().min(1)).optional().nullable(),
  }),
  z.object({
    id: uuidField,
    exercise_set_id: uuidField.optional(),
    item_type: z.literal("flashcard"),
    answer_key_json: flashcardAnswerKeySchema.optional(),
    prompt: z.string().trim().min(1).optional(),
    prompt_rich: z.string().trim().optional().nullable(),
    explanation: z.string().trim().optional().nullable(),
    sort_order: z.number().int().min(0).optional(),
    difficulty: z.string().trim().optional().nullable(),
    tags_json: z.array(z.string().trim().min(1)).optional().nullable(),
  }),
  z.object({
    id: uuidField,
    exercise_set_id: uuidField.optional(),
    item_type: z.literal("spelling"),
    answer_key_json: recallAnswerKeySchema.optional(),
    prompt: z.string().trim().min(1).optional(),
    prompt_rich: z.string().trim().optional().nullable(),
    explanation: z.string().trim().optional().nullable(),
    sort_order: z.number().int().min(0).optional(),
    difficulty: z.string().trim().optional().nullable(),
    tags_json: z.array(z.string().trim().min(1)).optional().nullable(),
  }),
]);

export const exerciseSetEditorSchema = createExerciseSetSchema.extend({
  items: z.array(exerciseItemEditorSchema).min(1, "Add at least one exercise item."),
});

export const mcqSubmittedAnswerSchema = z.object({
  selectedOptionId: z.string().trim().min(1, "Choose one option."),
});

export const recallSubmittedAnswerSchema = z.object({
  text: z.string().trim().min(1, "Enter an answer."),
});

export const flashcardSubmittedAnswerSchema = z.object({
  viewed: z.literal(true),
  selfEvaluation: z.enum(FLASHCARD_SELF_EVALUATIONS).optional(),
});

export function submittedAnswerSchemaForItemType(itemType: ExerciseItemType) {
  switch (itemType) {
    case "mcq":
      return mcqSubmittedAnswerSchema;
    case "spelling":
      return recallSubmittedAnswerSchema;
    case "flashcard":
      return flashcardSubmittedAnswerSchema;
    default:
      throw new Error(`Unsupported exercise item type: ${itemType}`);
  }
}

export const submitExerciseAttemptSchema = z.object({
  exercise_set_id: uuidField,
  item_id: uuidField,
  submitted_answer_json: z.unknown(),
});

export const retryWrongBookItemSchema = z.object({
  wrong_book_item_id: uuidField,
  submitted_answer_json: z.unknown(),
});

export type CreateExerciseSetSchema = z.infer<typeof createExerciseSetSchema>;
export type UpdateExerciseSetSchema = z.infer<typeof updateExerciseSetSchema>;
export type CreateExerciseItemSchema = z.infer<typeof createExerciseItemSchema>;
export type ExerciseItemEditorSchema = z.infer<typeof exerciseItemEditorSchema>;
export type UpdateExerciseItemSchema = z.infer<typeof updateExerciseItemSchema>;
export type ExerciseSetEditorSchema = z.infer<typeof exerciseSetEditorSchema>;
export type McqSubmittedAnswerSchema = z.infer<typeof mcqSubmittedAnswerSchema>;
export type RecallSubmittedAnswerSchema = z.infer<typeof recallSubmittedAnswerSchema>;
export type FlashcardSubmittedAnswerSchema = z.infer<typeof flashcardSubmittedAnswerSchema>;
export type SubmitExerciseAttemptSchema = z.infer<typeof submitExerciseAttemptSchema>;
export type RetryWrongBookItemSchema = z.infer<typeof retryWrongBookItemSchema>;
