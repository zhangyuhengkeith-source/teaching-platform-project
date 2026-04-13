"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SubmissionStatusStepper } from "@/components/domain/submission-status-stepper";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { saveTaskSubmissionDraftAction } from "@/lib/server/actions/save-task-submission-draft";
import { submitTaskSubmissionAction } from "@/lib/server/actions/submit-task-submission";
import { submissionDraftSchema, type SubmissionDraftSchema } from "@/lib/validations/electives";
import { formatDateTime } from "@/lib/utils/format";
import type { TaskDetail, TaskSubmissionSummary } from "@/types/domain";

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
  const { t } = useI18n();
  const form = useForm<SubmissionDraftSchema>({
    resolver: zodResolver(submissionDraftSchema),
    defaultValues: {
      id: submission?.id,
      task_id: task.id,
      text_content: submission?.textContent ?? "",
      content_json: submission?.contentJson ?? null,
      file_metadata: null,
    },
  });

  const runAction = (mode: "draft" | "submit") =>
    form.handleSubmit((values) => {
      setFormError(null);
      startTransition(async () => {
        try {
          if (mode === "draft") {
            await saveTaskSubmissionDraftAction(values);
          } else {
            await submitTaskSubmissionAction(values);
          }
          router.refresh();
        } catch (error) {
          setFormError(error instanceof Error ? error.message : t("forms.unableToSaveSubmission"));
        }
      });
    })();

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
          <p className="text-xs text-muted-foreground">{t("forms.attachmentsHint")}</p>
          {form.formState.errors.text_content ? <p className="text-sm text-red-600">{form.formState.errors.text_content.message}</p> : null}
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
          <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
            {t("forms.readOnly")}
          </div>
        )}
      </form>
    </div>
  );
}
