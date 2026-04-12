export const GROUP_MEMBER_ROLES = ["leader", "member"] as const;
export const GROUP_MEMBER_STATUSES = ["active", "pending", "removed"] as const;
export const SUBMISSION_MODES = ["individual", "group"] as const;

export type GroupMemberRole = (typeof GROUP_MEMBER_ROLES)[number];
export type GroupMemberStatus = (typeof GROUP_MEMBER_STATUSES)[number];
export type SubmissionMode = (typeof SUBMISSION_MODES)[number];
