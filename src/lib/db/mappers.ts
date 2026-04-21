import type {
  ExerciseAttemptRow,
  ExerciseItemRow,
  ExerciseSetRow,
  GroupMemberRow,
  GroupRow,
  NoticeRow,
  ProfileRow,
  ResourceFileRow,
  ResourceRow,
  SpaceMembershipRow,
  SpaceRow,
  SpaceSectionRow,
  StudentProfileRow,
  TaskRow,
  TaskSubmissionFileRow,
  TaskSubmissionRow,
  TeacherProfileRow,
  WrongBookItemRow,
  ContentChangeNotificationRow,
} from "@/types/database";
import type {
  ExerciseAttemptSummary,
  ExerciseItemSummary,
  ExerciseSetSummary,
  GroupMemberSummary,
  GroupSummary,
  NoticeSummary,
  ProfileSummary,
  ResourceFileSummary,
  ResourceSummary,
  SpaceMembershipSummary,
  SpaceSectionSummary,
  SpaceSummary,
  StudentProfileSummary,
  SubmissionFileSummary,
  TaskSubmissionSummary,
  TaskSummary,
  TeacherProfileSummary,
  WrongBookItemSummary,
  ContentChangeNotificationSummary,
} from "@/types/domain";

export function mapProfileRow(row: ProfileRow): ProfileSummary {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    userType: row.user_type,
    gradeLevel: row.grade_level,
    status: row.status,
  };
}

export function mapTeacherProfileRow(row: TeacherProfileRow): TeacherProfileSummary {
  return {
    id: row.id,
    profileId: row.profile_id,
    bio: row.bio,
    subjects: row.subjects,
    isFounder: row.is_founder,
  };
}

export function mapStudentProfileRow(row: StudentProfileRow): StudentProfileSummary {
  return {
    id: row.id,
    profileId: row.profile_id,
    internalStudentCode: row.internal_student_code,
    schoolName: row.school_name,
    notesPrivate: row.notes_private,
  };
}

export function mapSpaceRow(row: SpaceRow): SpaceSummary {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    description: row.description,
    academicYear: row.academic_year,
    status: row.status,
    ownerId: row.owner_id,
    createdBy: row.created_by,
    approvalStatus: row.approval_status,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    rejectedAt: row.rejected_at,
    rejectedBy: row.rejected_by,
    rejectionReason: row.rejection_reason,
    groupingLocked: row.grouping_locked,
    maxGroupSize: row.max_group_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSpaceMembershipRow(row: SpaceMembershipRow): SpaceMembershipSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    profileId: row.profile_id,
    membershipRole: row.membership_role,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

export function mapSpaceSectionRow(row: SpaceSectionRow): SpaceSectionSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    status: row.status,
    sortOrder: row.sort_order,
    description: row.description,
  };
}

export function mapResourceFileRow(row: ResourceFileRow): ResourceFileSummary {
  return {
    id: row.id,
    filePath: row.file_path,
    fileName: row.file_name,
    fileExt: row.file_ext,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    previewUrl: row.preview_url,
    sortOrder: row.sort_order,
  };
}

export function mapResourceRow(row: ResourceRow, files?: ResourceFileSummary[]): ResourceSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    sectionId: row.section_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    resourceType: row.resource_type,
    status: row.status,
    visibility: row.visibility,
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    files,
  };
}

export function mapNoticeRow(row: NoticeRow): NoticeSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    body: row.body,
    noticeType: row.notice_type,
    publishAt: row.publish_at,
    expireAt: row.expire_at,
    isPinned: row.is_pinned,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export function mapExerciseSetRow(row: ExerciseSetRow, itemCount?: number): ExerciseSetSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    sectionId: row.section_id,
    title: row.title,
    slug: row.slug,
    exerciseType: row.exercise_type,
    instructions: row.instructions,
    status: row.status,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount,
  };
}

export function mapExerciseItemRow(row: ExerciseItemRow): ExerciseItemSummary {
  return {
    id: row.id,
    exerciseSetId: row.exercise_set_id,
    prompt: row.prompt,
    promptRich: row.prompt_rich,
    itemType: row.item_type,
    answerKey: row.answer_key_json as unknown as ExerciseItemSummary["answerKey"],
    explanation: row.explanation,
    sortOrder: row.sort_order,
    difficulty: row.difficulty,
    tags: normalizeStringArray(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExerciseAttemptRow(row: ExerciseAttemptRow): ExerciseAttemptSummary {
  return {
    id: row.id,
    exerciseSetId: row.exercise_set_id,
    itemId: row.item_id,
    profileId: row.profile_id,
    submittedAnswer: (row.submitted_answer_json ?? {}) as ExerciseAttemptSummary["submittedAnswer"],
    isCorrect: row.is_correct,
    score: row.score,
    attemptNo: row.attempt_no,
    attemptedAt: row.attempted_at,
  };
}

export function mapWrongBookItemRow(row: WrongBookItemRow): WrongBookItemSummary {
  return {
    id: row.id,
    profileId: row.profile_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    latestAttemptId: row.latest_attempt_id,
    firstWrongAt: row.first_wrong_at,
    latestWrongAt: row.latest_wrong_at,
    masteredAt: row.mastered_at,
    status: row.status,
  };
}

export function mapGroupRow(row: GroupRow): GroupSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    slug: row.slug,
    leaderProfileId: row.leader_profile_id,
    projectTitle: row.project_title,
    projectSummary: row.project_summary,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGroupMemberRow(row: GroupMemberRow): GroupMemberSummary {
  return {
    id: row.id,
    groupId: row.group_id,
    profileId: row.profile_id,
    memberRole: row.member_role,
    joinedAt: row.joined_at,
    status: row.status,
  };
}

export function mapTaskRow(row: TaskRow): TaskSummary {
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    slug: row.slug,
    brief: row.brief,
    body: row.body,
    submissionMode: row.submission_mode,
    dueAt: row.due_at,
    allowResubmission: row.allow_resubmission,
    templateResourceId: row.template_resource_id,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskSubmissionFileRow(row: TaskSubmissionFileRow): SubmissionFileSummary {
  return {
    id: row.id,
    submissionId: row.submission_id,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  };
}

export function mapTaskSubmissionRow(row: TaskSubmissionRow, files?: SubmissionFileSummary[]): TaskSubmissionSummary {
  return {
    id: row.id,
    taskId: row.task_id,
    submitterProfileId: row.submitter_profile_id,
    submitterGroupId: row.submitter_group_id,
    status: row.status,
    submittedAt: row.submitted_at,
    contentJson: row.content_json as Record<string, unknown> | null,
    textContent: row.text_content,
    feedbackText: row.feedback_text,
    feedbackScore: row.feedback_score,
    feedbackBy: row.feedback_by,
    feedbackAt: row.feedback_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    files,
  };
}

export function mapContentChangeNotificationRow(row: ContentChangeNotificationRow): ContentChangeNotificationSummary {
  return {
    id: row.id,
    userId: row.user_id,
    classId: row.class_id,
    contentType: row.content_type,
    contentId: row.content_id,
    actionType: row.action_type,
    message: row.message,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
