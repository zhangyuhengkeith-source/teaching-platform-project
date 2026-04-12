import { notFound } from "next/navigation";

import { SubmissionFeedbackPanel } from "@/components/domain/submission-feedback-panel";
import { SubmissionReviewPanel } from "@/components/domain/submission-review-panel";
import { SubmissionStatusStepper } from "@/components/domain/submission-status-stepper";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { formatDateTime } from "@/lib/utils/format";
import { requireRole } from "@/lib/auth/require-role";
import { getManageableSubmissionById } from "@/lib/queries/electives";

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
      <PageHeader description="Review the submitted work, return revision notes, or mark the task complete." title={submission.taskTitle ?? "Submission review"} />
      <SectionCard description="Current submission workflow state." title="Status">
        <div className="space-y-4">
          <SubmissionStatusStepper status={submission.effectiveStatus ?? submission.status} />
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500">Submitter</p>
              <p className="mt-2 font-semibold text-slate-900">{submission.groupName ?? submission.submitterName ?? submission.submitterProfileId ?? "-"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500">Submitted</p>
              <p className="mt-2 font-semibold text-slate-900">{formatDateTime(submission.submittedAt)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500">Due</p>
              <p className="mt-2 font-semibold text-slate-900">{formatDateTime(submission.taskDueAt)}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard description="Student-submitted written content." title="Submission content">
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-slate-50/70 p-4 text-sm leading-7 text-muted-foreground">
          {submission.textContent ?? "No written response was provided in this submission."}
        </div>
      </SectionCard>

      <SectionCard description="Return revision requests or finalize the workflow." title="Feedback and status">
        <SubmissionReviewPanel submission={submission} />
      </SectionCard>

      <SubmissionFeedbackPanel submission={submission} />
    </div>
  );
}
