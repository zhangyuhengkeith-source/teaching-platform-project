import { MessageSquareQuote } from "lucide-react";

import { TranslationText } from "@/components/common/translation-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import type { TaskSubmissionSummary } from "@/types/domain";

export function SubmissionFeedbackPanel({ submission }: { submission: TaskSubmissionSummary }) {
  if (!submission.feedbackText && submission.feedbackScore == null) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-xl bg-blue-50 p-3 text-primary">
          <MessageSquareQuote className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-base"><TranslationText translationKey="admin.feedbackPanel.title" /></CardTitle>
          <p className="text-sm text-muted-foreground"><TranslationText translationKey="admin.feedbackPanel.updated" values={{ value: formatDateTime(submission.feedbackAt) }} /></p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {submission.feedbackScore != null ? <p className="font-medium text-slate-900"><TranslationText translationKey="admin.feedbackPanel.score" values={{ value: submission.feedbackScore }} /></p> : null}
        {submission.feedbackText ? <p className="whitespace-pre-wrap leading-7 text-muted-foreground">{submission.feedbackText}</p> : null}
      </CardContent>
    </Card>
  );
}
