import { notFound } from "next/navigation";

import { TranslationText } from "@/components/common/translation-text";
import { SubmissionFileList } from "@/components/domain/submission-file-list";
import { SubmissionFeedbackPanel } from "@/components/domain/submission-feedback-panel";
import { SubmissionReviewPanel } from "@/components/domain/submission-review-panel";
import { SubmissionStatusStepper } from "@/components/domain/submission-status-stepper";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { formatDateTime } from "@/lib/utils/format";
import { requireRole } from "@/lib/auth/require-role";
import { getManageableSubmissionById } from "@/lib/queries/tasks";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole(["super_admin", "teacher"]);
  const submission = await getManageableSubmissionById(id, profile);

  if (!submission) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader description={<TranslationText translationKey="admin.submissions.detailDescription" />} title={submission.taskTitle ?? <TranslationText translationKey="admin.submissions.detailDefaultTitle" />} />
      <SectionCard description={<TranslationText translationKey="admin.submissions.statusDescription" />} title={<TranslationText translationKey="admin.submissions.statusTitle" />}>
        <div className="space-y-4">
          <SubmissionStatusStepper status={submission.effectiveStatus ?? submission.status} />
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500"><TranslationText translationKey="admin.submissions.submitter" /></p>
              <p className="mt-2 font-semibold text-slate-900">{submission.groupName ?? submission.submitterName ?? submission.submitterProfileId ?? "-"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500"><TranslationText translationKey="admin.submissions.submitted" /></p>
              <p className="mt-2 font-semibold text-slate-900">{formatDateTime(submission.submittedAt)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500"><TranslationText translationKey="admin.submissions.due" /></p>
              <p className="mt-2 font-semibold text-slate-900">{formatDateTime(submission.taskDueAt)}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard description={<TranslationText translationKey="admin.submissions.contentDescription" />} title={<TranslationText translationKey="admin.submissions.contentTitle" />}>
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-slate-50/70 p-4 text-sm leading-7 text-muted-foreground">
          {submission.textContent ?? <TranslationText translationKey="admin.submissions.emptyContent" />}
        </div>
      </SectionCard>

      <SectionCard description="Attachments submitted with this work." title="Attachments">
        <SubmissionFileList files={submission.files ?? []} submissionId={submission.id} showCreatedAt />
      </SectionCard>

      <SectionCard description={<TranslationText translationKey="admin.submissions.reviewDescription" />} title={<TranslationText translationKey="admin.submissions.reviewTitle" />}>
        <SubmissionReviewPanel submission={submission} />
      </SectionCard>

      <SubmissionFeedbackPanel submission={submission} />
    </div>
  );
}
