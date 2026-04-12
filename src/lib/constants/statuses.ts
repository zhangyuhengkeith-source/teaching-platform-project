export const STATUSES = ["draft", "published", "archived", "pending", "active", "completed", "mastered", "forming", "locked", "submitted", "overdue", "returned", "resubmitted"] as const;

export type Status = (typeof STATUSES)[number];

export const SPACE_STATUSES = ["draft", "published", "archived"] as const;
export const NOTICE_STATUSES = ["draft", "published", "archived"] as const;
export const RESOURCE_STATUSES = ["draft", "published", "archived"] as const;
export const EXERCISE_SET_STATUSES = ["draft", "published"] as const;
export const WRONG_BOOK_STATUSES = ["active", "mastered"] as const;
export const GROUP_STATUSES = ["forming", "active", "locked", "archived"] as const;
export const TASK_STATUSES = ["draft", "published", "archived"] as const;
export const SUBMISSION_STATUSES = ["draft", "submitted", "overdue", "returned", "resubmitted", "completed"] as const;

export type SpaceStatus = (typeof SPACE_STATUSES)[number];
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];
export type ExerciseSetStatus = (typeof EXERCISE_SET_STATUSES)[number];
export type WrongBookStatus = (typeof WRONG_BOOK_STATUSES)[number];
export type GroupStatus = (typeof GROUP_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
