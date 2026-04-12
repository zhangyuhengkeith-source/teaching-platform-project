import type { ExerciseItemType, ExerciseSetType, FlashcardSelfEvaluation } from "@/lib/constants/exercise-types";
import type { GroupMemberRole, SubmissionMode } from "@/lib/constants/elective-types";
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
import type { NoticeType, ResourceVisibility, SpaceType } from "@/types/database";

export interface UpdateProfileInput {
  full_name: string;
  display_name?: string | null;
  grade_level?: string | null;
  avatar_url?: string | null;
}

export interface CreateSpaceInput {
  title: string;
  slug: string;
  type: SpaceType;
  description?: string | null;
  academic_year?: string | null;
  status?: SpaceStatus;
  grouping_locked?: boolean;
  max_group_size?: number;
}

export interface UpdateSpaceInput extends Partial<CreateSpaceInput> {
  id: string;
}

export interface CreateElectiveInput extends Omit<CreateSpaceInput, "type"> {
  title: string;
  slug: string;
  description?: string | null;
  academic_year?: string | null;
  status?: SpaceStatus;
  grouping_locked?: boolean;
  max_group_size?: number;
}

export interface UpdateElectiveInput extends Partial<CreateElectiveInput> {
  id: string;
}

export interface CreateResourceInput {
  space_id: string;
  section_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  resource_type: ResourceType;
  visibility: ResourceVisibility;
  status?: ResourceStatus;
  published_at?: string | null;
  sort_order?: number;
}

export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  id: string;
}

export interface CreateNoticeInput {
  space_id: string;
  title: string;
  body: string;
  notice_type: NoticeType;
  publish_at?: string | null;
  expire_at?: string | null;
  is_pinned?: boolean;
  status?: NoticeStatus;
}

export interface UpdateNoticeInput extends Partial<CreateNoticeInput> {
  id: string;
}

export interface ExerciseOptionInput {
  id: string;
  label: string;
}

export interface McqAnswerKeyInput {
  options: ExerciseOptionInput[];
  correctOptionId: string;
}

export interface FlashcardAnswerKeyInput {
  front: string;
  back: string;
}

export interface RecallAnswerKeyInput {
  acceptedAnswers: string[];
}

export type ExerciseAnswerKeyInput = McqAnswerKeyInput | FlashcardAnswerKeyInput | RecallAnswerKeyInput;

export interface CreateExerciseSetInput {
  space_id: string;
  section_id?: string | null;
  title: string;
  slug: string;
  exercise_type: ExerciseSetType;
  instructions?: string | null;
  status: ExerciseSetStatus;
}

export interface UpdateExerciseSetInput extends Partial<CreateExerciseSetInput> {
  id: string;
}

export interface CreateExerciseItemInput {
  exercise_set_id: string;
  prompt: string;
  prompt_rich?: string | null;
  item_type: ExerciseItemType;
  answer_key_json: ExerciseAnswerKeyInput;
  explanation?: string | null;
  sort_order?: number;
  difficulty?: string | null;
  tags_json?: string[] | null;
}

export interface UpdateExerciseItemInput extends Partial<CreateExerciseItemInput> {
  id: string;
}

export interface SubmitExerciseAttemptInput {
  exercise_set_id: string;
  item_id: string;
  submitted_answer_json:
    | { selectedOptionId: string }
    | { text: string }
    | { viewed: true; selfEvaluation?: FlashcardSelfEvaluation };
}

export interface RetryWrongBookItemInput {
  wrong_book_item_id: string;
  submitted_answer_json: { selectedOptionId: string } | { text: string };
}

export interface WrongBookTransitionResult {
  wrongBookItemId: string;
  status: WrongBookStatus;
}

export interface CreateGroupInput {
  space_id: string;
  name: string;
  slug: string;
  project_title?: string | null;
  project_summary?: string | null;
  leader_profile_id?: string;
  status?: GroupStatus;
}

export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  id: string;
}

export interface JoinGroupInput {
  group_id: string;
}

export interface LeaveGroupInput {
  group_id: string;
}

export interface RemoveGroupMemberInput {
  group_id: string;
  profile_id: string;
}

export interface CreateTaskInput {
  space_id: string;
  title: string;
  slug: string;
  brief?: string | null;
  body?: string | null;
  submission_mode: SubmissionMode;
  due_at?: string | null;
  allow_resubmission?: boolean;
  template_resource_id?: string | null;
  status?: TaskStatus;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

export interface CreateTaskSubmissionInput {
  task_id: string;
  submitter_profile_id?: string | null;
  submitter_group_id?: string | null;
  text_content?: string | null;
  content_json?: Record<string, unknown> | null;
  file_metadata?: Array<{
    file_path: string;
    file_name: string;
    mime_type?: string | null;
    file_size?: number | null;
  }> | null;
}

export interface UpdateTaskSubmissionDraftInput extends CreateTaskSubmissionInput {
  id?: string;
}

export interface SubmitTaskSubmissionInput extends UpdateTaskSubmissionDraftInput {
  id?: string;
}

export interface ReviewTaskSubmissionInput {
  submission_id: string;
  feedback_text?: string | null;
  feedback_score?: number | null;
  status: Extract<SubmissionStatus, "returned" | "completed">;
}
