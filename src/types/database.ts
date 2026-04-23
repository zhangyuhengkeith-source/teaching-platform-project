import type { ExerciseItemType, ExerciseSetType } from "@/lib/constants/exercise-types";
import type { GroupMemberRole, GroupMemberStatus, SubmissionMode } from "@/lib/constants/elective-types";
import type { SpaceMembershipRole, SpaceMembershipStatus } from "@/lib/constants/roles";
import type {
  ContentStatus,
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

export type SpaceType = "class" | "elective";
export type ClassApprovalStatus = "pending" | "approved" | "rejected";
export type ClassUpdateRequestStatus = "pending" | "approved" | "rejected";
export type SectionType = "chapter" | "module" | "week" | "topic_group";
export type ResourceVisibility = "space" | "selected_members" | "public";
export type NoticeType = "homework" | "deadline" | "mock_exam" | "general" | "grouping" | "service_update";
export type WrongBookSourceType = "exercise_item";
export type CourseChapterTemplateVisibility = "private" | "teachers";
export type ClassGroupingRuleStatus = "pending" | "completed";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          display_name: string | null;
          avatar_url: string | null;
          role: AppRole;
          user_type: UserType;
          grade_level: string | null;
          status: ProfileStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role: AppRole;
          user_type: UserType;
          grade_level?: string | null;
          status?: ProfileStatus;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      teacher_profiles: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          subjects: string[];
          is_founder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          subjects?: string[];
          is_founder?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teacher_profiles"]["Insert"]>;
        Relationships: [{ foreignKeyName: "teacher_profiles_profile_id_fkey"; columns: ["profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      student_profiles: {
        Row: {
          id: string;
          profile_id: string;
          internal_student_code: string | null;
          school_name: string | null;
          notes_private: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          internal_student_code?: string | null;
          school_name?: string | null;
          notes_private?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["student_profiles"]["Insert"]>;
        Relationships: [{ foreignKeyName: "student_profiles_profile_id_fkey"; columns: ["profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      spaces: {
        Row: {
          id: string;
          type: SpaceType;
          title: string;
          slug: string;
          description: string | null;
          academic_year: string | null;
          status: SpaceStatus;
          owner_id: string;
          created_by: string | null;
          approval_status: ClassApprovalStatus;
          submitted_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          grouping_locked: boolean;
          max_group_size: number;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: SpaceType;
          title: string;
          slug: string;
          description?: string | null;
          academic_year?: string | null;
          status?: SpaceStatus;
          owner_id: string;
          created_by?: string | null;
          approval_status?: ClassApprovalStatus;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          grouping_locked?: boolean;
          max_group_size?: number;
          archived_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["spaces"]["Insert"]>;
        Relationships: [{ foreignKeyName: "spaces_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      space_memberships: {
        Row: {
          id: string;
          space_id: string;
          profile_id: string;
          membership_role: SpaceMembershipRole;
          status: SpaceMembershipStatus;
          joined_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          profile_id: string;
          membership_role: SpaceMembershipRole;
          status?: SpaceMembershipStatus;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["space_memberships"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "space_memberships_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "space_memberships_profile_id_fkey"; columns: ["profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      class_update_requests: {
        Row: {
          id: string;
          class_id: string;
          requested_by: string;
          proposed_title: string;
          proposed_slug: string;
          proposed_description: string | null;
          proposed_academic_year: string | null;
          proposed_status: SpaceStatus;
          status: ClassUpdateRequestStatus;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          requested_by: string;
          proposed_title: string;
          proposed_slug: string;
          proposed_description?: string | null;
          proposed_academic_year?: string | null;
          proposed_status: SpaceStatus;
          status?: ClassUpdateRequestStatus;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["class_update_requests"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "class_update_requests_class_id_fkey"; columns: ["class_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "class_update_requests_requested_by_fkey"; columns: ["requested_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "class_update_requests_reviewed_by_fkey"; columns: ["reviewed_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      space_sections: {
        Row: {
          id: string;
          space_id: string;
          title: string;
          slug: string;
          type: SectionType;
          status: SpaceStatus;
          sort_order: number;
          description: string | null;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          title: string;
          slug: string;
          type: SectionType;
          status?: SpaceStatus;
          sort_order?: number;
          description?: string | null;
          archived_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["space_sections"]["Insert"]>;
        Relationships: [{ foreignKeyName: "space_sections_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] }];
      };
      resources: {
        Row: {
          id: string;
          space_id: string;
          section_id: string | null;
          chapter_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          resource_type: ResourceType;
          status: ResourceStatus;
          visibility: ResourceVisibility;
          created_by: string;
          updated_by: string | null;
          published_at: string | null;
          publish_at: string | null;
          archived_at: string | null;
          deleted_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          section_id?: string | null;
          chapter_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          resource_type: ResourceType;
          status?: ResourceStatus;
          visibility: ResourceVisibility;
          created_by: string;
          updated_by?: string | null;
          published_at?: string | null;
          publish_at?: string | null;
          archived_at?: string | null;
          deleted_at?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["resources"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "resources_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "resources_section_id_fkey"; columns: ["section_id"]; referencedRelation: "space_sections"; referencedColumns: ["id"] },
          { foreignKeyName: "resources_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "resources_updated_by_fkey"; columns: ["updated_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      resource_files: {
        Row: {
          id: string;
          resource_id: string;
          file_path: string;
          file_name: string;
          file_ext: string | null;
          mime_type: string | null;
          file_size: number | null;
          preview_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          file_path: string;
          file_name: string;
          file_ext?: string | null;
          mime_type?: string | null;
          file_size?: number | null;
          preview_url?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["resource_files"]["Insert"]>;
        Relationships: [{ foreignKeyName: "resource_files_resource_id_fkey"; columns: ["resource_id"]; referencedRelation: "resources"; referencedColumns: ["id"] }];
      };
      notices: {
        Row: {
          id: string;
          space_id: string;
          title: string;
          body: string;
          notice_type: NoticeType;
          publish_at: string | null;
          expire_at: string | null;
          is_pinned: boolean;
          status: NoticeStatus;
          created_by: string;
          updated_by: string | null;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          title: string;
          body: string;
          notice_type: NoticeType;
          publish_at?: string | null;
          expire_at?: string | null;
          is_pinned?: boolean;
          status?: NoticeStatus;
          created_by: string;
          updated_by?: string | null;
          archived_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notices"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "notices_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "notices_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "notices_updated_by_fkey"; columns: ["updated_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      exercise_sets: {
        Row: {
          id: string;
          space_id: string;
          section_id: string | null;
          chapter_id: string | null;
          title: string;
          slug: string;
          exercise_type: ExerciseSetType;
          instructions: string | null;
          status: ExerciseSetStatus;
          created_by: string;
          updated_by: string | null;
          publish_at: string | null;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          section_id?: string | null;
          chapter_id?: string | null;
          title: string;
          slug: string;
          exercise_type: ExerciseSetType;
          instructions?: string | null;
          status?: ExerciseSetStatus;
          created_by: string;
          updated_by?: string | null;
          publish_at?: string | null;
          archived_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_sets"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "exercise_sets_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "exercise_sets_section_id_fkey"; columns: ["section_id"]; referencedRelation: "space_sections"; referencedColumns: ["id"] },
          { foreignKeyName: "exercise_sets_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "exercise_sets_updated_by_fkey"; columns: ["updated_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      exercise_items: {
        Row: {
          id: string;
          exercise_set_id: string;
          prompt: string;
          prompt_rich: string | null;
          item_type: ExerciseItemType;
          answer_key_json: Json;
          explanation: string | null;
          sort_order: number;
          difficulty: string | null;
          tags_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exercise_set_id: string;
          prompt: string;
          prompt_rich?: string | null;
          item_type: ExerciseItemType;
          answer_key_json: Json;
          explanation?: string | null;
          sort_order?: number;
          difficulty?: string | null;
          tags_json?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_items"]["Insert"]>;
        Relationships: [{ foreignKeyName: "exercise_items_exercise_set_id_fkey"; columns: ["exercise_set_id"]; referencedRelation: "exercise_sets"; referencedColumns: ["id"] }];
      };
      exercise_attempts: {
        Row: {
          id: string;
          exercise_set_id: string;
          item_id: string;
          profile_id: string;
          submitted_answer_json: Json;
          is_correct: boolean | null;
          score: number | null;
          attempt_no: number;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          exercise_set_id: string;
          item_id: string;
          profile_id: string;
          submitted_answer_json: Json;
          is_correct?: boolean | null;
          score?: number | null;
          attempt_no?: number;
          attempted_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exercise_attempts"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "exercise_attempts_exercise_set_id_fkey"; columns: ["exercise_set_id"]; referencedRelation: "exercise_sets"; referencedColumns: ["id"] },
          { foreignKeyName: "exercise_attempts_item_id_fkey"; columns: ["item_id"]; referencedRelation: "exercise_items"; referencedColumns: ["id"] },
          { foreignKeyName: "exercise_attempts_profile_id_fkey"; columns: ["profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      wrong_book_items: {
        Row: {
          id: string;
          profile_id: string;
          source_type: WrongBookSourceType;
          source_id: string;
          latest_attempt_id: string;
          first_wrong_at: string;
          latest_wrong_at: string;
          mastered_at: string | null;
          status: WrongBookStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          source_type: WrongBookSourceType;
          source_id: string;
          latest_attempt_id: string;
          first_wrong_at?: string;
          latest_wrong_at?: string;
          mastered_at?: string | null;
          status?: WrongBookStatus;
        };
        Update: Partial<Database["public"]["Tables"]["wrong_book_items"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "wrong_book_items_profile_id_fkey"; columns: ["profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "wrong_book_items_latest_attempt_id_fkey"; columns: ["latest_attempt_id"]; referencedRelation: "exercise_attempts"; referencedColumns: ["id"] },
        ];
      };
      groups: {
        Row: {
          id: string;
          space_id: string;
          name: string;
          slug: string;
          leader_profile_id: string;
          project_title: string | null;
          project_summary: string | null;
          status: GroupStatus;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          name: string;
          slug: string;
          leader_profile_id: string;
          project_title?: string | null;
          project_summary?: string | null;
          status?: GroupStatus;
          archived_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "groups_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "groups_leader_profile_id_fkey"; columns: ["leader_profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          space_id: string;
          profile_id: string;
          member_role: GroupMemberRole;
          joined_at: string;
          status: GroupMemberStatus;
        };
        Insert: {
          id?: string;
          group_id: string;
          space_id?: string;
          profile_id: string;
          member_role: GroupMemberRole;
          joined_at?: string;
          status?: GroupMemberStatus;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "group_members_group_id_fkey"; columns: ["group_id"]; referencedRelation: "groups"; referencedColumns: ["id"] },
          { foreignKeyName: "group_members_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "group_members_profile_id_fkey"; columns: ["profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      class_grouping_rules: {
        Row: {
          id: string;
          class_id: string;
          max_students_per_group: number;
          instructions: string | null;
          deadline: string;
          auto_group_status: ClassGroupingRuleStatus;
          auto_grouped_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          max_students_per_group: number;
          instructions?: string | null;
          deadline: string;
          auto_group_status?: ClassGroupingRuleStatus;
          auto_grouped_at?: string | null;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_grouping_rules"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "class_grouping_rules_class_id_fkey"; columns: ["class_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "class_grouping_rules_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      tasks: {
        Row: {
          id: string;
          space_id: string;
          chapter_id: string | null;
          title: string;
          slug: string;
          brief: string | null;
          body: string | null;
          submission_mode: SubmissionMode;
          due_at: string | null;
          deadline: string | null;
          publish_at: string | null;
          allow_resubmission: boolean;
          template_resource_id: string | null;
          status: TaskStatus;
          archived_at: string | null;
          deleted_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          chapter_id?: string | null;
          title: string;
          slug: string;
          brief?: string | null;
          body?: string | null;
          submission_mode: SubmissionMode;
          due_at?: string | null;
          deadline?: string | null;
          publish_at?: string | null;
          allow_resubmission?: boolean;
          template_resource_id?: string | null;
          status?: TaskStatus;
          archived_at?: string | null;
          deleted_at?: string | null;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "tasks_space_id_fkey"; columns: ["space_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_template_resource_id_fkey"; columns: ["template_resource_id"]; referencedRelation: "resources"; referencedColumns: ["id"] },
          { foreignKeyName: "tasks_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      task_submissions: {
        Row: {
          id: string;
          task_id: string;
          submitter_profile_id: string | null;
          submitter_group_id: string | null;
          status: SubmissionStatus;
          submitted_at: string | null;
          content_json: Json | null;
          text_content: string | null;
          feedback_text: string | null;
          feedback_score: number | null;
          feedback_by: string | null;
          feedback_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          submitter_profile_id?: string | null;
          submitter_group_id?: string | null;
          status?: SubmissionStatus;
          submitted_at?: string | null;
          content_json?: Json | null;
          text_content?: string | null;
          feedback_text?: string | null;
          feedback_score?: number | null;
          feedback_by?: string | null;
          feedback_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["task_submissions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "task_submissions_task_id_fkey"; columns: ["task_id"]; referencedRelation: "tasks"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submissions_submitter_profile_id_fkey"; columns: ["submitter_profile_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submissions_submitter_group_id_fkey"; columns: ["submitter_group_id"]; referencedRelation: "groups"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submissions_feedback_by_fkey"; columns: ["feedback_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      task_submission_files: {
        Row: {
          id: string;
          submission_id: string;
          file_path: string;
          file_name: string;
          mime_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          file_path: string;
          file_name: string;
          mime_type?: string | null;
          file_size?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["task_submission_files"]["Insert"]>;
        Relationships: [{ foreignKeyName: "task_submission_files_submission_id_fkey"; columns: ["submission_id"]; referencedRelation: "task_submissions"; referencedColumns: ["id"] }];
      };
      course_chapter_sets: {
        Row: {
          id: string;
          class_id: string;
          main_title: string;
          subtitle: string | null;
          status: ContentStatus;
          created_by: string;
          updated_by: string | null;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          main_title: string;
          subtitle?: string | null;
          status?: ContentStatus;
          created_by: string;
          updated_by?: string | null;
          archived_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["course_chapter_sets"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "course_chapter_sets_class_id_fkey"; columns: ["class_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "course_chapter_sets_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "course_chapter_sets_updated_by_fkey"; columns: ["updated_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      course_chapter_items: {
        Row: {
          id: string;
          chapter_set_id: string;
          parent_id: string | null;
          level: number;
          title: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_set_id: string;
          parent_id?: string | null;
          level: number;
          title: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["course_chapter_items"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "course_chapter_items_chapter_set_id_fkey"; columns: ["chapter_set_id"]; referencedRelation: "course_chapter_sets"; referencedColumns: ["id"] },
          { foreignKeyName: "course_chapter_items_parent_id_fkey"; columns: ["parent_id"]; referencedRelation: "course_chapter_items"; referencedColumns: ["id"] },
        ];
      };
      course_chapter_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          visibility: CourseChapterTemplateVisibility;
          source_class_id: string | null;
          source_chapter_set_id: string | null;
          main_title: string;
          subtitle: string | null;
          items_json: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          visibility?: CourseChapterTemplateVisibility;
          source_class_id?: string | null;
          source_chapter_set_id?: string | null;
          main_title: string;
          subtitle?: string | null;
          items_json?: Json;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["course_chapter_templates"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "course_chapter_templates_source_class_id_fkey"; columns: ["source_class_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
          { foreignKeyName: "course_chapter_templates_source_chapter_set_id_fkey"; columns: ["source_chapter_set_id"]; referencedRelation: "course_chapter_sets"; referencedColumns: ["id"] },
          { foreignKeyName: "course_chapter_templates_created_by_fkey"; columns: ["created_by"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      content_change_notifications: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          content_type: "class" | "announcement" | "chapter" | "resource" | "assignment" | "practice_set" | "student_group";
          content_id: string;
          action_type: "edited" | "archived" | "deleted";
          message: string;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          content_type: "class" | "announcement" | "chapter" | "resource" | "assignment" | "practice_set" | "student_group";
          content_id: string;
          action_type: "edited" | "archived" | "deleted";
          message: string;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_change_notifications"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "content_change_notifications_user_id_fkey"; columns: ["user_id"]; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "content_change_notifications_class_id_fkey"; columns: ["class_id"]; referencedRelation: "spaces"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type TeacherProfileRow = Database["public"]["Tables"]["teacher_profiles"]["Row"];
export type StudentProfileRow = Database["public"]["Tables"]["student_profiles"]["Row"];
export type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];
export type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];
export type ClassUpdateRequestRow = Database["public"]["Tables"]["class_update_requests"]["Row"];
export type SpaceSectionRow = Database["public"]["Tables"]["space_sections"]["Row"];
export type ResourceRow = Database["public"]["Tables"]["resources"]["Row"];
export type ResourceFileRow = Database["public"]["Tables"]["resource_files"]["Row"];
export type NoticeRow = Database["public"]["Tables"]["notices"]["Row"];
export type ExerciseSetRow = Database["public"]["Tables"]["exercise_sets"]["Row"];
export type ExerciseItemRow = Database["public"]["Tables"]["exercise_items"]["Row"];
export type ExerciseAttemptRow = Database["public"]["Tables"]["exercise_attempts"]["Row"];
export type WrongBookItemRow = Database["public"]["Tables"]["wrong_book_items"]["Row"];
export type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMemberRow = Database["public"]["Tables"]["group_members"]["Row"];
export type ClassGroupingRuleRow = Database["public"]["Tables"]["class_grouping_rules"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskSubmissionRow = Database["public"]["Tables"]["task_submissions"]["Row"];
export type TaskSubmissionFileRow = Database["public"]["Tables"]["task_submission_files"]["Row"];
export type CourseChapterSetRow = Database["public"]["Tables"]["course_chapter_sets"]["Row"];
export type CourseChapterItemRow = Database["public"]["Tables"]["course_chapter_items"]["Row"];
export type CourseChapterTemplateRow = Database["public"]["Tables"]["course_chapter_templates"]["Row"];
export type ContentChangeNotificationRow = Database["public"]["Tables"]["content_change_notifications"]["Row"];
