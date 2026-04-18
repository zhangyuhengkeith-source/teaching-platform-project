import { z } from "zod";

import { RESOURCE_TYPES } from "@/lib/constants/resource-types";
import { RESOURCE_STATUSES } from "@/lib/constants/statuses";

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

export const createResourceSchema = z.object({
  space_id: z.string().uuid("Space id must be a valid UUID."),
  section_id: z.preprocess((value) => (value === "" ? null : value), z.string().uuid("Section id must be a valid UUID.").optional().nullable()),
  title: z.string().trim().min(1, "Title is required."),
  slug: z.string().trim().min(1, "Slug is required.").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens."),
  description: z.string().trim().optional().nullable(),
  resource_type: z.enum(RESOURCE_TYPES),
  visibility: z.enum(["space", "selected_members", "public"]),
  status: z.enum(RESOURCE_STATUSES).optional(),
  published_at: z.preprocess((value) => (value === "" ? null : value), z.string().datetime().optional().nullable()),
  sort_order: z.number().int().min(0).optional(),
  file_metadata: z.array(resourceFileSchema).optional().nullable(),
});

export const updateResourceSchema = createResourceSchema.partial().extend({
  id: z.string().uuid("Resource id must be a valid UUID."),
});

export type CreateResourceSchema = z.infer<typeof createResourceSchema>;
export type UpdateResourceSchema = z.infer<typeof updateResourceSchema>;
