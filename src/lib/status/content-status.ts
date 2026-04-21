import type { AppUserProfile } from "@/types/auth";
import type { ContentStatus } from "@/lib/constants/statuses";
import { isAdminRole } from "@/lib/permissions/profiles";

export type ContentChangeAction = "edited" | "archived" | "deleted";

export const ACTIVE_CONTENT_STATUSES: ContentStatus[] = ["draft", "published"];
export const ADMIN_CONTENT_STATUSES: ContentStatus[] = ["draft", "published", "archived", "deleted"];

export function isContentStatus(value: unknown): value is ContentStatus {
  return value === "draft" || value === "published" || value === "archived" || value === "deleted";
}

export function isNonArchivedContentStatus(status: ContentStatus) {
  return status !== "archived" && status !== "deleted";
}

export function isReadableContentStatus(profile: AppUserProfile | null | undefined, status: ContentStatus) {
  return isAdminRole(profile) || isNonArchivedContentStatus(status);
}

export function getDefaultContentStatusesForProfile(profile: AppUserProfile | null | undefined): ContentStatus[] {
  return isAdminRole(profile) ? ADMIN_CONTENT_STATUSES : ACTIVE_CONTENT_STATUSES;
}

export function getChangeActionFromStatusTransition(previousStatus: ContentStatus, nextStatus: ContentStatus): ContentChangeAction {
  if (nextStatus === "deleted") {
    return "deleted";
  }

  if (nextStatus === "archived" && previousStatus !== "archived") {
    return "archived";
  }

  return "edited";
}

export function withSoftDeleteStatus<T extends { status?: ContentStatus; archived_at?: string | null; deleted_at?: string | null }>(
  input: T,
  timestamp: string,
): T {
  if (input.status === "deleted") {
    return { ...input, deleted_at: input.deleted_at ?? timestamp };
  }

  if (input.status === "archived") {
    return { ...input, archived_at: input.archived_at ?? timestamp };
  }

  return input;
}
