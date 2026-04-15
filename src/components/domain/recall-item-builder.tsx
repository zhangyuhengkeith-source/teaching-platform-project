"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import type { ExerciseSetEditorSchema } from "@/lib/validations/exercises";

export function RecallItemBuilder({
  control,
  register,
  index,
  onRemove,
}: {
  control: Control<ExerciseSetEditorSchema>;
  register: UseFormRegister<ExerciseSetEditorSchema>;
  index: number;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const acceptedAnswers = useFieldArray({
    control,
    name: `items.${index}.answer_key_json.acceptedAnswers` as never,
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold">{t("admin.forms.recallItem", { index: index + 1 })}</h3>
        <Button onClick={onRemove} size="sm" type="button" variant="ghost">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("admin.forms.remove")}
        </Button>
      </div>
      <input type="hidden" value="spelling" {...register(`items.${index}.item_type` as const)} />
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.prompt")}</label>
        <Textarea {...register(`items.${index}.prompt` as const)} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("admin.forms.acceptedAnswers")}</label>
          <Button onClick={() => acceptedAnswers.append("" as never)} size="sm" type="button" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.forms.addAnswer")}
          </Button>
        </div>
        {acceptedAnswers.fields.map((field, answerIndex) => (
          <div className="grid gap-3 md:grid-cols-[1fr_auto]" key={field.id}>
            <Input placeholder={t("admin.forms.acceptedAnswer")} {...register(`items.${index}.answer_key_json.acceptedAnswers.${answerIndex}` as const)} />
            <Button onClick={() => acceptedAnswers.remove(answerIndex)} size="sm" type="button" variant="ghost">
              {t("admin.forms.remove")}
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.sortOrder")}</label>
          <Input type="number" {...register(`items.${index}.sort_order` as const, { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.explanation")}</label>
          <Textarea {...register(`items.${index}.explanation` as const)} />
        </div>
      </div>
    </div>
  );
}
