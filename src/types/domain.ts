import type { ExerciseItemType, ExerciseSetType, FlashcardSelfEvaluation } from "@/lib/constants/exercise-types";
import type { GroupMemberRole, GroupMemberStatus, SubmissionMode } from "@/lib/constants/elective-types";
import type { SpaceMembershipRole, SpaceMembershipStatus } from "@/lib/constants/roles";
import type {
  ExerciseSetStatus,
  GroupStatus,
  NoticeStatus,
  ResourceStatus,
  SpaceStatus,
  SubmissionStatus,
  TaskStatus,
  WrongBookStatus,
} from "@/lib/constants/statuses";
import type { ResourceType } from "@/lib/constants/resource-types";
import type { AppRole, ProfileStatus, UserType } from "@/types/auth";
import type { NoticeType, ResourceVisibility, SectionType, SpaceType } from "@/types/database";

export interface ProfileSummary {
  id: string;
  email: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: AppRole;
  userType: UserType;
  gradeLevel: string | null;
  status: ProfileStatus;
}

export interface TeacherProfileSummary {
  id: string;
  profileId: string;
  bio: string | null;
  subjects: string[];
  isFounder: boolean;
}

export interface StudentProfileSummary {
  id: string;
  profileId: string;
  internalStudentCode: string | null;
  schoolName: string | null;
  notesPrivate: string | null;
}

export interface SpaceMembershipSummary {
  id: string;
  profileId: string;
  spaceId: string;
  membershipRole: SpaceMembershipRole;
  status: SpaceMembershipStatus;
  joinedAt: string;
}

export interface SpaceSectionSummary {
  id: string;
  spaceId: string;
  title: string;
  slug: string;
  type: SectionType;
  sortOrder: number;
  description: string | null;
}

export interface SpaceSummary {
  id: string;
  type: SpaceType;
  title: string;
  slug: string;
  description: string | null;
  academicYear: string | null;
  status: SpaceStatus;
  ownerId: string;
  groupingLocked?: boolean;
  maxGroupSize?: number;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string | null;
}

export interface SpaceDetail extends SpaceSummary {
  sections: SpaceSectionSummary[];
  memberships?: SpaceMembershipSummary[];
}

export interface ResourceFileSummary {
  id: string;
  filePath: string;
  fileName: string;
  fileExt: string | null;
  mimeType: string | null;
  fileSize: number | null;
  previewUrl: string | null;
  sortOrder: number;
}

export interface ResourceSummary {
  id: string;
  spaceId: string;
  sectionId: string | null;
  title: string;
  slug: string;
  description: string | null;
  resourceType: ResourceType;
  status: ResourceStatus;
  visibility: ResourceVisibility;
  publishedAt: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  files?: ResourceFileSummary[];
}

export interface NoticeSummary {
  id: string;
  spaceId: string;
  title: string;
  body: string;
  noticeType: NoticeType;
  publishAt: string | null;
  expireAt: string | null;
  isPinned: boolean;
  status: NoticeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExerciseOption {
  id: string;
  label: string;
}

export interface McqAnswerKey {
  options: ExerciseOption[];
  correctOptionId: string;
}

export interface FlashcardAnswerKey {
  front: string;
  back: string;
}

export interface RecallAnswerKey {
  acceptedAnswers: string[];
}

export type ExerciseAnswerKey = McqAnswerKey | FlashcardAnswerKey | RecallAnswerKey;

export interface ExerciseSetSummary {
  id: string;
  spaceId: string;
  sectionId: string | null;
  title: string;
  slug: string;
  exerciseType: ExerciseSetType;
  instructions: string | null;
  status: ExerciseSetStatus;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  spaceTitle?: string;
  spaceSlug?: string;
  sectionTitle?: string | null;
  sectionSlug?: string | null;
}

export interface ExerciseItemSummary {
  id: string;
  exerciseSetId: string;
  prompt: string;
  promptRich: string | null;
  itemType: ExerciseItemType;
  answerKey: ExerciseAnswerKey;
  explanation: string | null;
  sortOrder: number;
  difficulty: string | null;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type ExerciseSubmittedAnswer =
  | { selectedOptionId: string }
  | { text: string }
  | { viewed: true; selfEvaluation?: FlashcardSelfEvaluation };

export interface ExerciseAttemptSummary {
  id: string;
  exerciseSetId: string;
  itemId: string;
  profileId: string;
  submittedAnswer: ExerciseSubmittedAnswer | Record<string, unknown>;
  isCorrect: boolean | null;
  score: number | null;
  attemptNo: number;
  attemptedAt: string;
}

export interface ExerciseSetDetail extends ExerciseSetSummary {
  items: ExerciseItemSummary[];
  space?: SpaceSummary;
  section?: SpaceSectionSummary | null;
  latestAttempts?: ExerciseAttemptSummary[];
}

export interface WrongBookItemSummary {
  id: string;
  profileId: string;
  sourceType: "exercise_item";
  sourceId: string;
  latestAttemptId: string;
  firstWrongAt: string;
  latestWrongAt: string;
  masteredAt: string | null;
  status: WrongBookStatus;
  sourceItem?: ExerciseItemSummary | null;
  exerciseSet?: ExerciseSetSummary | null;
  space?: SpaceSummary | null;
  section?: SpaceSectionSummary | null;
  latestAttempt?: ExerciseAttemptSummary | null;
}

export interface PracticeSubmissionResult {
  attempt: ExerciseAttemptSummary;
  isCorrect: boolean | null;
  score: number | null;
  normalizedAnswer: Record<string, unknown>;
  explanation: string | null;
  acceptedAnswers?: string[];
  correctOptionId?: string;
  wrongBookStatus?: WrongBookStatus | null;
}

export interface GroupMemberSummary {
  id: string;
  groupId: string;
  profileId: string;
  memberRole: GroupMemberRole;
  joinedAt: string;
  status: GroupMemberStatus;
  profileName?: string | null;
}

export interface GroupSummary {
  id: string;
  spaceId: string;
  name: string;
  slug: string;
  leaderProfileId: string;
  projectTitle: string | null;
  projectSummary: string | null;
  status: GroupStatus;
  createdAt: string;
  updatedAt: string;
  spaceTitle?: string;
  spaceSlug?: string;
  leaderName?: string | null;
  memberCount?: number;
}

export interface GroupDetail extends GroupSummary {
  members: GroupMemberSummary[];
}

export interface TaskSummary {
  id: string;
  spaceId: string;
  title: string;
  slug: string;
  brief: string | null;
  body: string | null;
  submissionMode: SubmissionMode;
  dueAt: string | null;
  allowResubmission: boolean;
  templateResourceId: string | null;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  spaceTitle?: string;
  spaceSlug?: string;
}

export interface SubmissionFileSummary {
  id: string;
  submissionId: string;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface TaskSubmissionSummary {
  id: string;
  taskId: string;
  submitterProfileId: string | null;
  submitterGroupId: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  contentJson: Record<string, unknown> | null;
  textContent: string | null;
  feedbackText: string | null;
  feedbackScore: number | null;
  feedbackBy: string | null;
  feedbackAt: string | null;
  createdAt: string;
  updatedAt: string;
  taskTitle?: string;
  taskSlug?: string;
  taskDueAt?: string | null;
  effectiveStatus?: SubmissionStatus;
  submitterName?: string | null;
  groupName?: string | null;
  files?: SubmissionFileSummary[];
}

export interface TaskDetail extends TaskSummary {
  templateResource?: ResourceSummary | null;
  submission?: TaskSubmissionSummary | null;
}
