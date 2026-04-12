"use client";

import type { Control, UseFormRegister } from "react-hook-form";

import { FlashcardItemBuilder } from "@/components/domain/flashcard-item-builder";
import { McqItemBuilder } from "@/components/domain/mcq-item-builder";
import { RecallItemBuilder } from "@/components/domain/recall-item-builder";
import type { ExerciseItemEditorSchema, ExerciseSetEditorSchema } from "@/lib/validations/exercises";

export function ExerciseItemBuilder({
  control,
  register,
  item,
  index,
  onRemove,
}: {
  control: Control<ExerciseSetEditorSchema>;
  register: UseFormRegister<ExerciseSetEditorSchema>;
  item: ExerciseItemEditorSchema;
  index: number;
  onRemove: () => void;
}) {
  if (item.item_type === "mcq") {
    return <McqItemBuilder control={control} index={index} onRemove={onRemove} register={register} />;
  }

  if (item.item_type === "flashcard") {
    return <FlashcardItemBuilder control={control} index={index} onRemove={onRemove} register={register} />;
  }

  return <RecallItemBuilder control={control} index={index} onRemove={onRemove} register={register} />;
}
