"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";

export function RecallQuestionCard({
  prompt,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  feedback,
}: {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  feedback?: {
    isCorrect: boolean;
    explanation?: string | null;
    acceptedAnswers?: string[];
  } | null;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="recall-answer">
            {t("practice.yourAnswer")}
          </label>
          <Input id="recall-answer" onChange={(event) => onChange(event.target.value)} value={value} />
        </div>
        {feedback ? (
          <div className={`rounded-xl px-4 py-3 text-sm ${feedback.isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            <p className="font-medium">{feedback.isCorrect ? t("practice.correctAnswer") : t("practice.incorrectAnswer")}</p>
            {feedback.acceptedAnswers?.length ? (
              <p className="mt-1 leading-6">{t("practice.acceptedAnswers")}: {feedback.acceptedAnswers.join(", ")}</p>
            ) : null}
            {feedback.explanation ? <p className="mt-1 leading-6">{feedback.explanation}</p> : null}
          </div>
        ) : null}
        <Button disabled={!value.trim() || isSubmitting} onClick={onSubmit} type="button">
          {isSubmitting ? t("practice.submitting") : t("practice.checkAnswer")}
        </Button>
      </CardContent>
    </Card>
  );
}
