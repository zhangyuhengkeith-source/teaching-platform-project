import { z } from "zod";

import { CLASS_SUBJECTS } from "@/lib/constants/class-subjects";
import { SPACE_STATUSES } from "@/lib/constants/statuses";

export const classSubjectSchema = z.enum(CLASS_SUBJECTS, {
  error: "Please select a subject.",
});

export const createClassFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  subject: classSubjectSchema,
  description: z.string().trim().optional().nullable(),
  academic_year: z.string().trim().max(20).optional().nullable(),
  status: z.enum(SPACE_STATUSES),
});

export const updateClassFormSchema = createClassFormSchema.extend({
  id: z.string().uuid("Space id must be a valid UUID."),
});

export type CreateClassFormSchema = z.infer<typeof createClassFormSchema>;
export type UpdateClassFormSchema = z.infer<typeof updateClassFormSchema>;
