import { z } from "zod";

import { NOTICE_STATUSES } from "@/lib/constants/statuses";

export const createNoticeSchema = z.object({
  space_id: z.string().uuid("Space id must be a valid UUID."),
  title: z.string().trim().min(1, "Title is required."),
  body: z.string().trim().min(1, "Body is required."),
  notice_type: z.enum(["homework", "deadline", "mock_exam", "general", "grouping", "service_update"]),
  publish_at: z.preprocess((value) => (value === "" ? null : value), z.string().datetime().optional().nullable()),
  expire_at: z.preprocess((value) => (value === "" ? null : value), z.string().datetime().optional().nullable()),
  is_pinned: z.boolean().optional(),
  status: z.enum(NOTICE_STATUSES).optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial().extend({
  id: z.string().uuid("Notice id must be a valid UUID."),
});

export type CreateNoticeSchema = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeSchema = z.infer<typeof updateNoticeSchema>;
