"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import type { McqAnswerKey } from "@/types/domain";

export function McqQuestionCard({
  prompt,
  answerKey,
  selectedOptionId,
  onSelect,
  onSubmit,
  isSubmitting,
  feedback,
}: {
  prompt: string;
  answerKey: McqAnswerKey;
  selectedOptionId: string;
  onSelect: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  feedback?: {
    isCorrect: boolean;
    explanation?: string | null;
    correctOptionId?: string;
  } | null;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {answerKey.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = feedback?.correctOptionId === option.id;

            return (
              <button
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  isCorrectOption
                    ? "border-emerald-300 bg-emerald-50"
                    : isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-border bg-white hover:border-slate-300"
                }`}
                key={option.id}
                onClick={() => onSelect(option.id)}
                type="button"
              >
                <span className="font-medium text-slate-900">{option.id}.</span> {option.label}
              </button>
            );
          })}
        </div>
        {feedback ? (
          <div className={`rounded-xl px-4 py-3 text-sm ${feedback.isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            <p className="font-medium">{feedback.isCorrect ? t("practice.correctAnswer") : t("practice.incorrectAnswer")}</p>
            {feedback.explanation ? <p className="mt-1 leading-6">{feedback.explanation}</p> : null}
          </div>
        ) : null}
        <Button disabled={!selectedOptionId || isSubmitting} onClick={onSubmit} type="button">
          {isSubmitting ? t("practice.submitting") : t("practice.submitAnswer")}
        </Button>
      </CardContent>
    </Card>
  );
}
