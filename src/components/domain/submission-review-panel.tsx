"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { reviewTaskSubmissionAction } from "@/lib/server/actions/review-task-submission";
import { submissionReviewSchema, type SubmissionReviewSchema } from "@/lib/validations/electives";
import type { TaskSubmissionSummary } from "@/types/domain";

export function SubmissionReviewPanel({ submission }: { submission: TaskSubmissionSummary }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { t } = useI18n();
  const form = useForm<SubmissionReviewSchema>({
    resolver: zodResolver(submissionReviewSchema) as Resolver<SubmissionReviewSchema>,
    defaultValues: {
      submission_id: submission.id,
      feedback_text: submission.feedbackText ?? "",
      feedback_score: submission.feedbackScore ?? null,
      status: submission.status === "completed" ? "completed" : "returned",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await reviewTaskSubmissionAction(values);
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("forms.unableToSaveFeedback"));
      }
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input type="hidden" value={submission.id} {...form.register("submission_id")} />
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("forms.feedback")}</label>
        <Textarea rows={10} {...form.register("feedback_text")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("forms.score")}</label>
          <Input type="number" {...form.register("feedback_score", { setValueAs: (value) => (value === "" ? null : Number(value)) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("forms.nextStatus")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("status")}>
            <option value="returned">{t("forms.returnForRevision")}</option>
            <option value="completed">{t("forms.markCompleted")}</option>
          </select>
        </div>
      </div>
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <Button type="submit">{isPending ? t("forms.saving") : t("forms.saveFeedback")}</Button>
    </form>
  );
}
