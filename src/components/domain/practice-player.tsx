"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { FlashcardViewer } from "@/components/domain/flashcard-viewer";
import { McqQuestionCard } from "@/components/domain/mcq-question-card";
import { PracticeSummaryCard } from "@/components/domain/practice-summary-card";
import { RecallQuestionCard } from "@/components/domain/recall-question-card";
import { Button } from "@/components/ui/button";
import { submitExerciseAttemptAction } from "@/lib/server/actions/submit-exercise-attempt";
import type { ExerciseSetDetail, PracticeSubmissionResult } from "@/types/domain";

interface PracticePlayerProps {
  exerciseSet: ExerciseSetDetail;
  wrongBookHref: string;
}

export function PracticePlayer({ exerciseSet, wrongBookHref }: PracticePlayerProps) {
  const [isPending, startTransition] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [recallValue, setRecallValue] = useState("");
  const [feedbackByItemId, setFeedbackByItemId] = useState<Record<string, PracticeSubmissionResult>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  const items = exerciseSet.items;
  const currentItem = items[currentIndex];
  const currentFeedback = currentItem ? feedbackByItemId[currentItem.id] : null;
  const attemptedResults = Object.values(feedbackByItemId);
  const correctCount = attemptedResults.filter((entry) => entry.isCorrect === true).length;
  const incorrectCount = attemptedResults.filter((entry) => entry.isCorrect === false).length;
  const wrongBookCount = attemptedResults.filter((entry) => entry.wrongBookStatus === "active").length;

  const progressText = `${Math.min(currentIndex + 1, items.length)} / ${items.length}`;
  const isCurrentSubmitted = currentItem ? Boolean(feedbackByItemId[currentItem.id]) : false;

  const canMoveNext = useMemo(() => {
    if (!currentItem) {
      return false;
    }

    return Boolean(feedbackByItemId[currentItem.id]);
  }, [currentItem, feedbackByItemId]);

  const submitAnswer = (submittedAnswer: PracticeSubmissionResult["attempt"]["submittedAnswer"]) => {
    if (!currentItem) {
      return;
    }

    setFormError(null);

    startTransition(async () => {
      try {
        const result = await submitExerciseAttemptAction({
          exercise_set_id: exerciseSet.id,
          item_id: currentItem.id,
          submitted_answer_json: submittedAnswer,
        });

        setFeedbackByItemId((existing) => ({
          ...existing,
          [currentItem.id]: result,
        }));
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to submit answer.");
      }
    });
  };

  const handleNext = () => {
    if (currentIndex === items.length - 1) {
      setSessionComplete(true);
      return;
    }

    setSelectedOptionId("");
    setRecallValue("");
    setCurrentIndex((value) => value + 1);
  };

  const handleRetrySet = () => {
    setCurrentIndex(0);
    setSelectedOptionId("");
    setRecallValue("");
    setFeedbackByItemId({});
    setFormError(null);
    setSessionComplete(false);
  };

  if (!currentItem) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-sm text-muted-foreground">
        No exercise items have been added yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div className="rounded-2xl border border-border bg-white px-5 py-4">
          <p className="text-sm text-muted-foreground">Progress</p>
          <p className="mt-1 text-lg font-semibold">{progressText}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white px-5 py-4">
          <p className="text-sm text-muted-foreground">Completed items</p>
          <p className="mt-1 text-lg font-semibold">{attemptedResults.length}</p>
        </div>
      </div>

      {currentItem.itemType === "mcq" && "options" in currentItem.answerKey ? (
        <McqQuestionCard
          answerKey={currentItem.answerKey}
          feedback={
            currentFeedback && currentFeedback.isCorrect !== null
              ? {
                  isCorrect: currentFeedback.isCorrect,
                  explanation: currentFeedback.explanation,
                  correctOptionId: currentFeedback.correctOptionId,
                }
              : null
          }
          isSubmitting={isPending}
          onSelect={setSelectedOptionId}
          onSubmit={() => submitAnswer({ selectedOptionId })}
          prompt={currentItem.prompt}
          selectedOptionId={selectedOptionId}
        />
      ) : null}

      {currentItem.itemType === "spelling" ? (
        <RecallQuestionCard
          feedback={
            currentFeedback && currentFeedback.isCorrect !== null
              ? {
                  isCorrect: currentFeedback.isCorrect,
                  explanation: currentFeedback.explanation,
                  acceptedAnswers: currentFeedback.acceptedAnswers,
                }
              : null
          }
          isSubmitting={isPending}
          onChange={setRecallValue}
          onSubmit={() => submitAnswer({ text: recallValue })}
          prompt={currentItem.prompt}
          value={recallValue}
        />
      ) : null}

      {currentItem.itemType === "flashcard" && "front" in currentItem.answerKey ? (
        <FlashcardViewer
          back={currentItem.answerKey.back}
          feedback={currentFeedback ? { explanation: currentFeedback.explanation } : null}
          front={currentItem.answerKey.front}
          isSubmitting={isPending}
          onMark={(selfEvaluation) => submitAnswer({ viewed: true, selfEvaluation })}
        />
      ) : null}

      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} type="button" variant="outline">
          Previous
        </Button>
        <Button disabled={!canMoveNext || isPending} onClick={handleNext} type="button">
          {currentIndex === items.length - 1 ? "Finish set" : "Next item"}
        </Button>
      </div>

      {sessionComplete ? (
        <div className="space-y-4">
          <PracticeSummaryCard attempted={attemptedResults.length} correct={correctCount} incorrect={incorrectCount} />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRetrySet} type="button" variant="outline">
              Retry set
            </Button>
            {wrongBookCount > 0 ? (
              <Button asChild>
                <Link href={wrongBookHref}>Review wrong-book</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCurrentSubmitted && !sessionComplete ? (
        <p className="text-sm text-muted-foreground">
          Answer saved. Move to the next item when you are ready.
        </p>
      ) : null}
    </div>
  );
}
