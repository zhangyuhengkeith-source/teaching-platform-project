"use client";

import { Trash2 } from "lucide-react";
import type { Control, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseSetEditorSchema } from "@/lib/validations/exercises";

export function FlashcardItemBuilder({
  register,
  index,
  onRemove,
}: {
  control: Control<ExerciseSetEditorSchema>;
  register: UseFormRegister<ExerciseSetEditorSchema>;
  index: number;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold">Flashcard Item {index + 1}</h3>
        <Button onClick={onRemove} size="sm" type="button" variant="ghost">
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>
      <input type="hidden" value="flashcard" {...register(`items.${index}.item_type` as const)} />
      <div className="space-y-2">
        <label className="text-sm font-medium">Prompt</label>
        <Textarea {...register(`items.${index}.prompt` as const)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Front</label>
          <Textarea {...register(`items.${index}.answer_key_json.front` as const)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Back</label>
          <Textarea {...register(`items.${index}.answer_key_json.back` as const)} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sort order</label>
          <Input type="number" {...register(`items.${index}.sort_order` as const, { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Explanation</label>
          <Textarea {...register(`items.${index}.explanation` as const)} />
        </div>
      </div>
    </div>
  );
}
