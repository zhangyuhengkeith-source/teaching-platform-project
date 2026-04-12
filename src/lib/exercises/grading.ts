import type { ExerciseItemSummary, ExerciseSubmittedAnswer, PracticeSubmissionResult } from "@/types/domain";

function collapseWhitespace(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeRecallAnswer(value: string) {
  return collapseWhitespace(value);
}

function normalizeMcqAnswer(answer: { selectedOptionId: string }) {
  return { selectedOptionId: answer.selectedOptionId.trim() };
}

function gradeMcq(item: ExerciseItemSummary, submittedAnswer: { selectedOptionId: string }): Omit<PracticeSubmissionResult, "attempt" | "wrongBookStatus"> {
  if (item.itemType !== "mcq" || !("correctOptionId" in item.answerKey)) {
    throw new Error("MCQ grading received a malformed item.");
  }

  const normalizedAnswer = normalizeMcqAnswer(submittedAnswer);
  const isCorrect = normalizedAnswer.selectedOptionId === item.answerKey.correctOptionId;

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    normalizedAnswer,
    explanation: item.explanation,
    correctOptionId: item.answerKey.correctOptionId,
  };
}

function gradeRecall(item: ExerciseItemSummary, submittedAnswer: { text: string }): Omit<PracticeSubmissionResult, "attempt" | "wrongBookStatus"> {
  if (item.itemType !== "spelling" || !("acceptedAnswers" in item.answerKey)) {
    throw new Error("Recall grading received a malformed item.");
  }

  const normalizedText = normalizeRecallAnswer(submittedAnswer.text);
  const normalizedAcceptedAnswers = item.answerKey.acceptedAnswers.map(normalizeRecallAnswer);
  const isCorrect = normalizedAcceptedAnswers.includes(normalizedText);

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    normalizedAnswer: { text: normalizedText },
    explanation: item.explanation,
    acceptedAnswers: item.answerKey.acceptedAnswers,
  };
}

function handleFlashcard(item: ExerciseItemSummary, submittedAnswer: { viewed: true; selfEvaluation?: "got_it" | "needs_review" }): Omit<PracticeSubmissionResult, "attempt" | "wrongBookStatus"> {
  if (item.itemType !== "flashcard") {
    throw new Error("Flashcard grading received a malformed item.");
  }

  return {
    isCorrect: null,
    score: null,
    normalizedAnswer: {
      viewed: true,
      ...(submittedAnswer.selfEvaluation ? { selfEvaluation: submittedAnswer.selfEvaluation } : {}),
    },
    explanation: item.explanation,
  };
}

export function gradeExerciseSubmission(item: ExerciseItemSummary, submittedAnswer: ExerciseSubmittedAnswer): Omit<PracticeSubmissionResult, "attempt" | "wrongBookStatus"> {
  switch (item.itemType) {
    case "mcq":
      if (!("selectedOptionId" in submittedAnswer)) {
        throw new Error("MCQ submission is malformed.");
      }
      return gradeMcq(item, submittedAnswer);
    case "spelling":
      if (!("text" in submittedAnswer)) {
        throw new Error("Recall submission is malformed.");
      }
      return gradeRecall(item, submittedAnswer);
    case "flashcard":
      if (!("viewed" in submittedAnswer)) {
        throw new Error("Flashcard submission is malformed.");
      }
      return handleFlashcard(item, submittedAnswer);
    default:
      throw new Error(`Unsupported exercise item type: ${String(item.itemType)}`);
  }
}

export function isWrongBookEligible(item: ExerciseItemSummary) {
  return item.itemType === "mcq" || item.itemType === "spelling";
}
