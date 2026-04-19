"use client";

import { useEffect, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SubmissionFileList } from "@/components/domain/submission-file-list";
import { SubmissionStatusStepper } from "@/components/domain/submission-status-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { MAX_SUBMISSION_FILE_SIZE_BYTES } from "@/lib/db/storage";
import { saveTaskSubmissionDraftAction } from "@/lib/server/actions/save-task-submission-draft";
import { submitTaskSubmissionAction } from "@/lib/server/actions/submit-task-submission";
import { submissionDraftSchema, type SubmissionDraftSchema } from "@/lib/validations/electives";
import { formatDateTime, formatFileSize } from "@/lib/utils/format";
import { removeUploadedStorageObjects, uploadSubmissionFiles } from "@/services/storage-service";
import type { SubmissionFileSummary, TaskDetail, TaskSubmissionSummary } from "@/types/domain";

interface PendingSubmissionFile {
  clientId: string;
  file: File;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
}

function createPendingSubmissionFile(file: File): PendingSubmissionFile {
  return {
    clientId: crypto.randomUUID(),
    file,
    fileName: file.name,
    mimeType: file.type || null,
    fileSize: file.size,
  };
}

function toSubmissionFileMetadata(file: SubmissionFileSummary) {
  return {
    id: file.id,
    file_path: file.filePath,
    file_name: file.fileName,
    mime_type: file.mimeType,
    file_size: file.fileSize,
  };
}

export function SubmissionPanel({
  task,
  submission,
  canEdit,
  contextLabel,
}: {
  task: TaskDetail;
  submission: TaskSubmissionSummary | null;
  canEdit: boolean;
  contextLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<SubmissionFileSummary[]>(submission?.files ?? []);
  const [pendingFiles, setPendingFiles] = useState<PendingSubmissionFile[]>([]);
  const { t } = useI18n();
  const form = useForm<SubmissionDraftSchema>({
    resolver: zodResolver(submissionDraftSchema),
    defaultValues: {
      id: submission?.id,
      task_id: task.id,
      text_content: submission?.textContent ?? "",
      content_json: submission?.contentJson ?? null,
      file_metadata: (submission?.files ?? []).map(toSubmissionFileMetadata),
    },
  });

  useEffect(() => {
    const nextFiles = submission?.files ?? [];
    setExistingFiles(nextFiles);
    setPendingFiles([]);
    setFormError(null);
    form.reset({
      id: submission?.id,
      task_id: task.id,
      text_content: submission?.textContent ?? "",
      content_json: submission?.contentJson ?? null,
      file_metadata: nextFiles.map(toSubmissionFileMetadata),
    });
  }, [form, submission, task.id]);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    setFormError(null);

    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_SUBMISSION_FILE_SIZE_BYTES);
    if (oversizedFile) {
      setFormError(`\u6587\u4ef6 ${oversizedFile.name} \u8d85\u8fc7\u4e86 ${formatFileSize(MAX_SUBMISSION_FILE_SIZE_BYTES)} \u7684\u5927\u5c0f\u9650\u5236\u3002`);
      event.target.value = "";
      return;
    }

    setPendingFiles((current) => [...current, ...selectedFiles.map(createPendingSubmissionFile)]);
    event.target.value = "";
  }

  function removeExistingFile(fileId: string) {
    setExistingFiles((current) => current.filter((file) => file.id !== fileId));
  }

  function removePendingFile(clientId: string) {
    setPendingFiles((current) => current.filter((file) => file.clientId !== clientId));
  }

  const runAction = (mode: "draft" | "submit") => {
    setFormError(null);
    startTransition(async () => {
      let uploadedObjects: Array<{ bucket: string; objectPath: string }> = [];

      try {
        const values = form.getValues();
        const uploadedMetadata: Array<{
          file_path: string;
          file_name: string;
          mime_type: string | null;
          file_size: number | null;
        }> = [];

        if (pendingFiles.length > 0) {
          const spacePathSegment = task.spaceSlug ?? task.spaceId;
          const uploadResult = await uploadSubmissionFiles(spacePathSegment, task.slug, pendingFiles);
          uploadedObjects = uploadResult.uploadedObjects;
          uploadedMetadata.push(...uploadResult.fileMetadata);
        }

        const payload = submissionDraftSchema.parse({
          ...values,
          id: values.id || undefined,
          file_metadata: [...existingFiles.map(toSubmissionFileMetadata), ...uploadedMetadata],
        });

        if (mode === "draft") {
          const result = await saveTaskSubmissionDraftAction(payload);
          if (!result.ok) {
            throw new Error(result.error);
          }
        } else {
          const result = await submitTaskSubmissionAction(payload);
          if (!result.ok) {
            throw new Error(result.error);
          }
        }

        form.clearErrors();
        router.refresh();
      } catch (error) {
        try {
          await removeUploadedStorageObjects(uploadedObjects);
        } catch {
          // Best-effort cleanup; surface the original error instead.
        }
        setFormError(error instanceof Error ? error.message : t("forms.unableToSaveSubmission"));
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">{t("forms.submissionContext")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{contextLabel}</p>
      </div>
      {submission ? (
        <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">{t("forms.currentStatus")}</p>
            <SubmissionStatusStepper status={submission.effectiveStatus ?? submission.status} />
          </div>
          <p className="text-sm text-muted-foreground">{t("forms.submittedAt", { value: formatDateTime(submission.submittedAt) })}</p>
        </div>
      ) : null}
      <form className="space-y-4">
        <input type="hidden" value={submission?.id ?? ""} {...form.register("id")} />
        <input type="hidden" value={task.id} {...form.register("task_id")} />
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("forms.writtenResponse")}</label>
          <Textarea disabled={!canEdit || isPending} minLength={10} rows={12} {...form.register("text_content")} />
          <p className="text-xs text-muted-foreground">
            {"\u53ef\u9009\u4e0a\u4f20\u8865\u5145\u9644\u4ef6\u3002\u6bcf\u4e2a\u6587\u4ef6\u5927\u5c0f\u4e0a\u9650\u4e3a "}
            {formatFileSize(MAX_SUBMISSION_FILE_SIZE_BYTES)}
            {"\u3002"}
          </p>
          {form.formState.errors.text_content ? <p className="text-sm text-red-600">{form.formState.errors.text_content.message}</p> : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-dashed border-border bg-slate-50 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{"\u9644\u4ef6"}</p>
            <p className="text-sm text-muted-foreground">
              {"\u5df2\u63d0\u4ea4\u7684\u6587\u4ef6\u4f1a\u4fdd\u7559\u6743\u9650\u63a7\u5236\uff0c\u5e76\u901a\u8fc7\u7b7e\u540d\u4e0b\u8f7d\u94fe\u63a5\u6253\u5f00\u3002"}
            </p>
          </div>
          {canEdit ? <Input disabled={isPending} multiple onChange={handleFileSelection} type="file" /> : null}
          <SubmissionFileList
            emptyText={
              canEdit
                ? "\u5f53\u524d\u8fd8\u6ca1\u6709\u4e0a\u4f20\u9644\u4ef6\uff0c\u5982\u6709\u9700\u8981\u53ef\u5728\u4e0a\u65b9\u6dfb\u52a0\u3002"
                : "\u672c\u6b21\u63d0\u4ea4\u6ca1\u6709\u9644\u4ef6\u3002"
            }
            files={existingFiles}
            onRemove={canEdit ? removeExistingFile : undefined}
            submissionId={submission?.id}
            showCreatedAt
          />
          {pendingFiles.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              {pendingFiles.map((file) => (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0" key={file.clientId}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {"\u7b49\u5f85\u4e0a\u4f20"}
                      {formatFileSize(file.fileSize) ? ` \u00b7 ${formatFileSize(file.fileSize)}` : ""}
                    </p>
                  </div>
                  <Button onClick={() => removePendingFile(file.clientId)} size="sm" type="button" variant="ghost">
                    {"\u79fb\u9664"}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
        {canEdit ? (
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} onClick={() => runAction("draft")} type="button" variant="outline">
              {isPending ? t("forms.saving") : t("forms.saveDraft")}
            </Button>
            <Button disabled={isPending} onClick={() => runAction("submit")} type="button">
              {isPending ? t("practice.submitting") : submission?.status === "returned" ? t("forms.submitRevision") : t("forms.submitWork")}
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">{t("forms.readOnly")}</div>
        )}
      </form>
    </div>
  );
}
