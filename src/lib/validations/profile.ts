import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  display_name: z.string().trim().max(120).optional().nullable(),
  grade_level: z.string().trim().max(50).optional().nullable(),
  avatar_url: z.union([z.string().url("Avatar URL must be valid."), z.literal(""), z.null()]).optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

