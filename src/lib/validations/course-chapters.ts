import { z } from "zod";

import { CONTENT_STATUSES } from "@/lib/constants/statuses";

export const courseChapterItemSchema = z.object({
  id: z.string().uuid("Chapter item id must be a valid UUID.").optional(),
  parent_id: z.string().uuid("Parent id must be a valid UUID.").optional().nullable(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  title: z.string().trim().min(1, "Chapter title is required.").max(160, "Chapter title is too long."),
  description: z.string().trim().max(1000, "Description is too long.").optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

export const courseChapterSetSchema = z.object({
  class_id: z.string().uuid("Class id must be a valid UUID."),
  main_title: z.string().trim().min(1, "Course main title is required.").max(160, "Course main title is too long."),
  subtitle: z.string().trim().max(160, "Course subtitle is too long.").optional().nullable(),
  status: z.enum(CONTENT_STATUSES).optional(),
  items: z.array(courseChapterItemSchema).max(400, "A chapter outline can contain at most 400 items.").optional(),
});

export const updateCourseChapterSetSchema = courseChapterSetSchema.partial().extend({
  id: z.string().uuid("Chapter set id must be a valid UUID."),
});

export const saveCourseChapterTemplateSchema = z.object({
  chapter_set_id: z.string().uuid("Chapter set id must be a valid UUID."),
  name: z.string().trim().min(1, "Template name is required.").max(160, "Template name is too long."),
  description: z.string().trim().max(1000, "Template description is too long.").optional().nullable(),
  visibility: z.enum(["private", "teachers"]),
});

export const importCourseChapterTemplateSchema = z.object({
  template_id: z.string().uuid("Template id must be a valid UUID."),
  main_title: z.string().trim().max(160, "Course main title is too long.").optional().nullable(),
  subtitle: z.string().trim().max(160, "Course subtitle is too long.").optional().nullable(),
});
