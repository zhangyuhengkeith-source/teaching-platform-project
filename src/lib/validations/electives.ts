import { z } from "zod";

import { GROUP_STATUSES, SUBMISSION_STATUSES, TASK_STATUSES } from "@/lib/constants/statuses";
import { GROUP_MEMBER_ROLES, SUBMISSION_MODES } from "@/lib/constants/elective-types";

const uuidField = z.string().uuid("A valid UUID is required.");
const slugField = z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens.");
const datetimeField = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "A valid date and time is required.")
    .optional()
    .nullable(),
);

export const createElectiveSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: slugField,
  description: z.string().trim().optional().nullable(),
  academic_year: z.string().trim().max(20).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  grouping_locked: z.boolean().optional(),
  max_group_size: z.number().int().min(2).max(12).optional(),
});

export const updateElectiveSchema = createElectiveSchema.partial().extend({
  id: uuidField,
});

export const createGroupSchema = z.object({
  space_id: uuidField,
  name: z.string().trim().min(1, "Group name is required."),
  project_title: z.string().trim().max(160).optional().nullable(),
  project_summary: z.string().trim().max(2000).optional().nullable(),
  leader_profile_id: uuidField.optional(),
  status: z.enum(GROUP_STATUSES).optional(),
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  id: uuidField,
});

export const joinGroupSchema = z.object({
  group_id: uuidField,
});

export const leaveGroupSchema = z.object({
  group_id: uuidField,
});

export const removeGroupMemberSchema = z.object({
  group_id: uuidField,
  profile_id: uuidField,
});

export const createTaskSchema = z.object({
  space_id: uuidField,
  title: z.string().trim().min(1, "Title is required."),
  slug: slugField,
  brief: z.string().trim().max(300).optional().nullable(),
  body: z.string().trim().max(8000).optional().nullable(),
  submission_mode: z.enum(SUBMISSION_MODES),
  due_at: datetimeField,
  allow_resubmission: z.boolean().optional(),
  template_resource_id: z.preprocess((value) => (value === "" ? null : value), uuidField.optional().nullable()),
  status: z.enum(TASK_STATUSES).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: uuidField,
});

export const submissionFileSchema = z.object({
  id: uuidField.optional(),
  file_path: z.string().trim().min(1),
  file_name: z.string().trim().min(1),
  mime_type: z.string().trim().optional().nullable(),
  file_size: z.number().int().min(0).optional().nullable(),
});

export const submissionDraftSchema = z
  .object({
    id: uuidField.optional(),
    task_id: uuidField,
    text_content: z.string().trim().max(12000).optional().nullable(),
    content_json: z.record(z.string(), z.unknown()).optional().nullable(),
    file_metadata: z.array(submissionFileSchema).optional().nullable(),
  })
  .refine((value) => Boolean(value.text_content || value.content_json || (value.file_metadata?.length ?? 0) > 0), {
    message: "Add text, structured content, or a file before saving.",
    path: ["text_content"],
  });

export const submissionReviewSchema = z.object({
  submission_id: uuidField,
  feedback_text: z.string().trim().max(6000).optional().nullable(),
  feedback_score: z.preprocess((value) => (value === "" ? null : value), z.number().min(0).max(100).optional().nullable()),
  status: z.enum(["returned", "completed"]),
});

export type CreateElectiveSchema = z.infer<typeof createElectiveSchema>;
export type UpdateElectiveSchema = z.infer<typeof updateElectiveSchema>;
export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
export type UpdateGroupSchema = z.infer<typeof updateGroupSchema>;
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;
export type SubmissionDraftSchema = z.infer<typeof submissionDraftSchema>;
export type SubmissionReviewSchema = z.infer<typeof submissionReviewSchema>;
