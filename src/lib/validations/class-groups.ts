import { z } from "zod";

import { GROUP_STATUSES } from "@/lib/constants/statuses";

const uuidField = z.string().uuid("A valid UUID is required.");
const datetimeField = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "A valid date and time is required."),
);

export const createClassGroupingRuleSchema = z.object({
  max_students_per_group: z.number().int().min(1).max(30),
  instructions: z.string().trim().max(3000).optional().nullable(),
  deadline: datetimeField,
});

export const createClassGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required.").max(120),
  leader_profile_id: uuidField,
  project_summary: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(GROUP_STATUSES).optional(),
});

export const updateClassGroupSchema = createClassGroupSchema.partial();

export const moveClassGroupMemberSchema = z.object({
  profile_id: uuidField,
  target_group_id: uuidField.optional().nullable(),
  member_role: z.enum(["leader", "member"]).optional(),
});

export const groupStatusFilterSchema = z.enum(["all", "open", "full", "archived"]).optional();
