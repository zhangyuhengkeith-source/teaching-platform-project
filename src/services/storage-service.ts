"use client";

import { getApiBaseUrl, getStorageMode } from "@/lib/config/app-config";
import {
  STORAGE_BUCKETS,
  buildResourceObjectPath,
  buildSubmissionObjectPath,
  type StorageObjectRef,
} from "@/lib/db/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const STORAGE_CONFIG_ERROR = "File storage is not configured.";

function getUnsupportedStorageModeMessage() {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl) {
    return `Storage mode "${getStorageMode()}" is configured, but the browser storage service still needs a provider implementation for ${apiBaseUrl}.`;
  }

  return `Storage mode "${getStorageMode()}" is configured, but the browser storage service still needs a provider implementation.`;
}

interface StorageUploadDraft {
  file: File;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
}

interface ResourceStorageUploadDraft extends StorageUploadDraft {
  fileExt: string | null;
}

interface StorageUploadRequest {
  bucket: string;
  objectPath: string;
  file: File;
  mimeType?: string;
}

function buildStorageFilePath(ref: StorageObjectRef) {
  return `${ref.bucket}/${ref.objectPath}`;
}

function getBrowserStorageClient() {
  if (getStorageMode() !== "supabase") {
    throw new Error(getUnsupportedStorageModeMessage());
  }

  const client = createSupabaseBrowserClient();

  if (!client) {
    throw new Error(STORAGE_CONFIG_ERROR);
  }

  return client;
}

function assertSupportedBrowserStorageMode() {
  if (getStorageMode() !== "supabase") {
    throw new Error(getUnsupportedStorageModeMessage());
  }
}

async function uploadStorageObjects(requests: StorageUploadRequest[]): Promise<StorageObjectRef[]> {
  const client = getBrowserStorageClient();
  const uploadedObjects: StorageObjectRef[] = [];

  try {
    for (const request of requests) {
      const { error } = await client.storage.from(request.bucket).upload(request.objectPath, request.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: request.mimeType,
      });

      if (error) {
        throw new Error(error.message);
      }

      uploadedObjects.push({
        bucket: request.bucket,
        objectPath: request.objectPath,
      });
    }

    return uploadedObjects;
  } catch (error) {
    try {
      await removeUploadedStorageObjects(uploadedObjects);
    } catch {
      // Best-effort rollback for partially uploaded browser files.
    }

    throw error;
  }
}

// Migration seam: replace the storage provider implementation here without changing form components.
export async function removeUploadedStorageObjects(uploadedObjects: StorageObjectRef[]) {
  if (uploadedObjects.length === 0) {
    return;
  }

  assertSupportedBrowserStorageMode();

  const client = createSupabaseBrowserClient();

  if (!client) {
    return;
  }

  const groupedPaths = new Map<string, string[]>();

  uploadedObjects.forEach(({ bucket, objectPath }) => {
    groupedPaths.set(bucket, [...(groupedPaths.get(bucket) ?? []), objectPath]);
  });

  for (const [bucket, objectPaths] of groupedPaths.entries()) {
    await client.storage.from(bucket).remove(objectPaths);
  }
}

export async function uploadResourceFiles(spaceSlug: string, files: ResourceStorageUploadDraft[]) {
  const uploads = files.map((file) => {
    const objectPath = buildResourceObjectPath(spaceSlug, file.fileName);

    return {
      request: {
        bucket: STORAGE_BUCKETS.resourceFiles,
        objectPath,
        file: file.file,
        mimeType: file.mimeType ?? undefined,
      },
      metadata: {
        file_path: buildStorageFilePath({
          bucket: STORAGE_BUCKETS.resourceFiles,
          objectPath,
        }),
        file_name: file.fileName,
        file_ext: file.fileExt,
        mime_type: file.mimeType,
        file_size: file.fileSize,
        preview_url: null,
        sort_order: 0,
      },
    };
  });

  const uploadedObjects = await uploadStorageObjects(uploads.map((upload) => upload.request));

  return {
    uploadedObjects,
    fileMetadata: uploads.map((upload) => upload.metadata),
  };
}

export async function uploadSubmissionFiles(spacePathSegment: string, taskSlug: string, files: StorageUploadDraft[]) {
  const uploads = files.map((file) => {
    const objectPath = buildSubmissionObjectPath(spacePathSegment, taskSlug, file.fileName);

    return {
      request: {
        bucket: STORAGE_BUCKETS.submissionFiles,
        objectPath,
        file: file.file,
        mimeType: file.mimeType ?? undefined,
      },
      metadata: {
        file_path: buildStorageFilePath({
          bucket: STORAGE_BUCKETS.submissionFiles,
          objectPath,
        }),
        file_name: file.fileName,
        mime_type: file.mimeType,
        file_size: file.fileSize,
      },
    };
  });

  const uploadedObjects = await uploadStorageObjects(uploads.map((upload) => upload.request));

  return {
    uploadedObjects,
    fileMetadata: uploads.map((upload) => upload.metadata),
  };
}
