import { getApiBaseUrl, getStorageMode } from "@/lib/config/app-config";
import { splitStorageFilePath } from "@/lib/db/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StorageServiceErrorCode = "invalid_path" | "not_configured" | "download_link_unavailable" | "delete_failed" | "provider_not_supported";

export class StorageServiceError extends Error {
  constructor(
    public readonly code: StorageServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StorageServiceError";
  }
}

export function isStorageServiceError(error: unknown): error is StorageServiceError {
  return error instanceof StorageServiceError;
}

export function getStorageServiceErrorStatusCode(error: StorageServiceError) {
  if (error.code === "not_configured") {
    return 503;
  }

  if (error.code === "provider_not_supported") {
    return 501;
  }

  return 404;
}

interface CreateSignedDownloadUrlInput {
  filePath: string;
  downloadFileName: string;
  expiresInSeconds: number;
}

interface RemoveStoredFilesInput {
  filePaths: string[];
}

function assertSupportedStorageMode() {
  if (getStorageMode() === "supabase") {
    return;
  }

  const apiBaseUrl = getApiBaseUrl();
  const message = apiBaseUrl
    ? `Storage mode "${getStorageMode()}" is configured, but the server storage service still needs a provider implementation for ${apiBaseUrl}.`
    : `Storage mode "${getStorageMode()}" is configured, but the server storage service still needs a provider implementation.`;

  throw new StorageServiceError("provider_not_supported", message);
}

// Migration seam: move provider-specific signed download generation behind this service.
export async function createSignedDownloadUrl(input: CreateSignedDownloadUrlInput): Promise<string> {
  assertSupportedStorageMode();

  const parsedPath = splitStorageFilePath(input.filePath);

  if (!parsedPath) {
    throw new StorageServiceError("invalid_path", "Invalid file path.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new StorageServiceError("not_configured", "Storage is not configured.");
  }

  const { data, error } = await supabase.storage.from(parsedPath.bucket).createSignedUrl(parsedPath.objectPath, input.expiresInSeconds, {
    download: input.downloadFileName,
  });

  if (error || !data?.signedUrl) {
    throw new StorageServiceError("download_link_unavailable", error?.message ?? "Unable to create a download link.");
  }

  return data.signedUrl;
}

// Migration seam: move provider-specific storage deletion behind this service.
export async function removeStoredFiles(input: RemoveStoredFilesInput): Promise<void> {
  assertSupportedStorageMode();

  if (input.filePaths.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new StorageServiceError("not_configured", "Storage is not configured.");
  }

  const groupedPaths = new Map<string, string[]>();

  input.filePaths.forEach((filePath) => {
    const parsedPath = splitStorageFilePath(filePath);

    if (!parsedPath) {
      return;
    }

    groupedPaths.set(parsedPath.bucket, [...(groupedPaths.get(parsedPath.bucket) ?? []), parsedPath.objectPath]);
  });

  for (const [bucket, objectPaths] of groupedPaths.entries()) {
    const { error } = await supabase.storage.from(bucket).remove(objectPaths);

    if (error) {
      throw new StorageServiceError("delete_failed", error.message);
    }
  }
}
