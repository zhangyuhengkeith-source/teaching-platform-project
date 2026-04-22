import { z } from "zod";

import { EXERCISE_SET_TYPES } from "@/lib/constants/exercise-types";
import { RESOURCE_TYPES } from "@/lib/constants/resource-types";
import { SUBMISSION_MODES } from "@/lib/constants/elective-types";
import { CONTENT_STATUSES } from "@/lib/constants/statuses";
import { exerciseItemEditorSchema } from "@/lib/validations/exercises";

const uuidField = z.string().uuid("A valid UUID is required.");
const nullableUuidField = z.preprocess((value) => (value === "" ? null : value), uuidField.optional().nullable());
const datetimeField = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "A valid date and time is required.")
    .optional()
    .nullable(),
);
const slugField = z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens.");
const resourceFileSchema = z.object({
  id: z.string().uuid().optional(),
  file_path: z.string().trim().min(1, "File path is required."),
  file_name: z.string().trim().min(1, "File name is required."),
  file_ext: z.string().trim().optional().nullable(),
  mime_type: z.string().trim().optional().nullable(),
  file_size: z.number().int().min(0).optional().nullable(),
  preview_url: z.string().trim().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

export const classResourceSchema = z.object({
  chapter_id: nullableUuidField,
  title: z.string().trim().min(1, "Title is required."),
  slug: slugField,
  description: z.string().trim().optional().nullable(),
  resource_type: z.enum(RESOURCE_TYPES),
  publish_at: datetimeField,
  status: z.enum(CONTENT_STATUSES).optional(),
  file_metadata: z.array(resourceFileSchema).optional().nullable(),
});

export const classTaskSchema = z.object({
  chapter_id: nullableUuidField,
  title: z.string().trim().min(1, "Title is required."),
  slug: slugField,
  body: z.string().trim().max(8000).optional().nullable(),
  submission_mode: z.enum(SUBMISSION_MODES),
  publish_at: datetimeField,
  deadline: datetimeField,
  allow_resubmission: z.boolean().optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
});

export const classPracticeSetSchema = z.object({
  chapter_id: nullableUuidField,
  title: z.string().trim().min(1, "Title is required."),
  slug: slugField,
  instructions: z.string().trim().optional().nullable(),
  exercise_type: z.enum(EXERCISE_SET_TYPES),
  publish_at: datetimeField,
  status: z.enum(CONTENT_STATUSES).optional(),
});

export const classPracticeSetWithItemsSchema = classPracticeSetSchema.extend({
  items: z.array(exerciseItemEditorSchema).optional(),
});

export const classContentActionSchema = z.object({
  action: z.enum(["archive", "publish_now", "reschedule"]).optional(),
  publish_at: datetimeField,
});
