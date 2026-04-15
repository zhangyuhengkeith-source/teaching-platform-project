"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import type { ExerciseSetEditorSchema } from "@/lib/validations/exercises";

export function McqItemBuilder({
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
  const options = useFieldArray({
    control,
    name: `items.${index}.answer_key_json.options` as never,
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold">{t("admin.forms.mcqItem", { index: index + 1 })}</h3>
        <Button onClick={onRemove} size="sm" type="button" variant="ghost">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("admin.forms.remove")}
        </Button>
      </div>
      <input type="hidden" value="mcq" {...register(`items.${index}.item_type` as const)} />
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.prompt")}</label>
        <Textarea {...register(`items.${index}.prompt` as const)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.correctOptionId")}</label>
          <Input placeholder="A" {...register(`items.${index}.answer_key_json.correctOptionId` as const)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.difficulty")}</label>
          <Input placeholder="foundation" {...register(`items.${index}.difficulty` as const)} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("admin.forms.options")}</label>
          <Button
            onClick={() => options.append({ id: String.fromCharCode(65 + options.fields.length), label: "" } as never)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.forms.addOption")}
          </Button>
        </div>
        {options.fields.map((field, optionIndex) => (
          <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]" key={field.id}>
            <Input placeholder="A" {...register(`items.${index}.answer_key_json.options.${optionIndex}.id` as const)} />
            <Input placeholder={t("admin.forms.optionLabel")} {...register(`items.${index}.answer_key_json.options.${optionIndex}.label` as const)} />
            <Button onClick={() => options.remove(optionIndex)} size="sm" type="button" variant="ghost">
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
