export const STORAGE_BUCKETS = {
  resourceFiles: "resource-files",
  submissionFiles: "submission-files",
  essayFiles: "essay-files",
  avatars: "avatars",
} as const;

export function buildResourceFilePath(spaceSlug: string, fileName: string) {
  return `${STORAGE_BUCKETS.resourceFiles}/${spaceSlug}/${fileName}`;
}

export function buildAvatarPath(profileId: string, fileName: string) {
  return `${STORAGE_BUCKETS.avatars}/${profileId}/${fileName}`;
}

// TODO(Task 3): replace with signed URL helpers once storage policies are enabled.
export function getProtectedFileAccessStub(filePath: string) {
  return {
    filePath,
    requiresSignedUrl: true,
  };
}

