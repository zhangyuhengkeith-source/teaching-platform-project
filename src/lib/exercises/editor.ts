import type { ExerciseItemType } from "@/lib/constants/exercise-types";
import type { ExerciseItemEditorSchema, ExerciseSetEditorSchema } from "@/lib/validations/exercises";
import type { ExerciseSetDetail } from "@/types/domain";

export function getDefaultExerciseItemType(exerciseType: ExerciseSetEditorSchema["exercise_type"]): ExerciseItemType {
  if (exerciseType === "mcq") {
    return "mcq";
  }

  if (exerciseType === "flashcard") {
    return "flashcard";
  }

  return "spelling";
}

export function createDefaultExerciseItem(itemType: ExerciseItemEditorSchema["item_type"]): ExerciseItemEditorSchema {
  if (itemType === "mcq") {
    return {
      item_type: "mcq",
      prompt: "",
      prompt_rich: null,
      answer_key_json: {
        options: [
          { id: "A", label: "" },
          { id: "B", label: "" },
        ],
        correctOptionId: "A",
      },
      explanation: null,
      sort_order: 0,
      difficulty: "foundation",
      tags_json: [],
    };
  }

  if (itemType === "flashcard") {
    return {
      item_type: "flashcard",
      prompt: "",
      prompt_rich: null,
      answer_key_json: {
        front: "",
        back: "",
      },
      explanation: null,
      sort_order: 0,
      difficulty: "foundation",
      tags_json: [],
    };
  }

  return {
    item_type: "spelling",
    prompt: "",
    prompt_rich: null,
    answer_key_json: {
      acceptedAnswers: [""],
    },
    explanation: null,
    sort_order: 0,
    difficulty: "foundation",
    tags_json: [],
  };
}

export function mapExerciseSetDetailToEditorValues(initialValues?: ExerciseSetDetail): ExerciseSetEditorSchema {
  const mappedItems: ExerciseItemEditorSchema[] =
    initialValues?.items.map((item) => {
      if (item.itemType === "mcq" && "options" in item.answerKey) {
        return {
          item_type: "mcq",
          prompt: item.prompt,
          prompt_rich: item.promptRich ?? null,
          answer_key_json: item.answerKey,
          explanation: item.explanation ?? null,
          sort_order: item.sortOrder,
          difficulty: item.difficulty ?? null,
          tags_json: item.tags ?? [],
        };
      }

      if (item.itemType === "flashcard" && "front" in item.answerKey) {
        return {
          item_type: "flashcard",
          prompt: item.prompt,
          prompt_rich: item.promptRich ?? null,
          answer_key_json: item.answerKey,
          explanation: item.explanation ?? null,
          sort_order: item.sortOrder,
          difficulty: item.difficulty ?? null,
          tags_json: item.tags ?? [],
        };
      }

      return {
        item_type: "spelling",
        prompt: item.prompt,
        prompt_rich: item.promptRich ?? null,
        answer_key_json: "acceptedAnswers" in item.answerKey ? item.answerKey : { acceptedAnswers: [""] },
        explanation: item.explanation ?? null,
        sort_order: item.sortOrder,
        difficulty: item.difficulty ?? null,
        tags_json: item.tags ?? [],
      };
    }) ?? [createDefaultExerciseItem("mcq")];

  return {
    title: initialValues?.title ?? "",
    slug: initialValues?.slug ?? "",
    exercise_type: initialValues?.exerciseType ?? "mcq",
    instructions: initialValues?.instructions ?? "",
    status: initialValues?.status ?? "draft",
    space_id: initialValues?.spaceId ?? "",
    section_id: initialValues?.sectionId ?? "",
    items: mappedItems,
  };
}
