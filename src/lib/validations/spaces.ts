import { z } from "zod";

import { SPACE_STATUSES } from "@/lib/constants/statuses";

export const spaceTypeSchema = z.enum(["class", "elective"]);

export const createSpaceSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  type: spaceTypeSchema,
  description: z.string().trim().optional().nullable(),
  academic_year: z.string().trim().max(20).optional().nullable(),
  status: z.enum(SPACE_STATUSES).optional(),
});

export const updateSpaceSchema = createSpaceSchema.partial().extend({
  id: z.string().uuid("Space id must be a valid UUID."),
});

export type CreateSpaceSchema = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceSchema = z.infer<typeof updateSpaceSchema>;

