import { z } from "zod";

import { NOTICE_STATUSES } from "@/lib/constants/statuses";

const datetimeField = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "A valid date and time is required.")
    .optional()
    .nullable(),
);

export const createNoticeSchema = z.object({
  space_id: z.string().uuid("Space id must be a valid UUID."),
  title: z.string().trim().min(1, "Title is required."),
  body: z.string().trim().min(1, "Body is required."),
  notice_type: z.enum(["homework", "deadline", "mock_exam", "general", "grouping", "service_update"]),
  publish_at: datetimeField,
  expire_at: datetimeField,
  is_pinned: z.boolean().optional(),
  status: z.enum(NOTICE_STATUSES).optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  id: z.string().uuid("Notice id must be a valid UUID."),
});

export type CreateNoticeSchema = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeSchema = z.infer<typeof updateNoticeSchema>;
