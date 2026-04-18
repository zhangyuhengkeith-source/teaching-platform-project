export const STORAGE_BUCKETS = {
  resourceFiles: "resource-files",
  submissionFiles: "submission-files",
  essayFiles: "essay-files",
  avatars: "avatars",
} as const;

export const MAX_RESOURCE_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const RESOURCE_FILE_SIGNED_URL_TTL_SECONDS = 60;

export interface StorageObjectRef {
  bucket: string;
  objectPath: string;
}

export function sanitizeStorageFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getFileExtension(fileName: string) {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() ?? null : null;
}

export function buildResourceObjectPath(spaceSlug: string, fileName: string) {
  const safeFileName = sanitizeStorageFileName(fileName) || `resource-file.${getFileExtension(fileName) ?? "bin"}`;
  return `${spaceSlug}/${crypto.randomUUID()}-${safeFileName}`;
}

export function buildResourceFilePath(spaceSlug: string, fileName: string) {
  return `${STORAGE_BUCKETS.resourceFiles}/${buildResourceObjectPath(spaceSlug, fileName)}`;
}

export function buildAvatarPath(profileId: string, fileName: string) {
  return `${STORAGE_BUCKETS.avatars}/${profileId}/${fileName}`;
}

export function splitStorageFilePath(filePath: string): StorageObjectRef | null {
  const normalized = filePath.trim().replace(/^\/+/, "");
  const [bucket, ...segments] = normalized.split("/");

  if (!bucket || segments.length === 0) {
    return null;
  }

  return {
    bucket,
    objectPath: segments.join("/"),
  };
}
