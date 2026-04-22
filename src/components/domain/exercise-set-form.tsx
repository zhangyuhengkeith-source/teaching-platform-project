"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { Plus } from "lucide-react";

import { ExerciseItemBuilder } from "@/components/domain/exercise-item-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { createDefaultExerciseItem, mapExerciseSetDetailToEditorValues } from "@/lib/exercises/editor";
import { createExerciseSetAction } from "@/lib/server/actions/create-exercise-set";
import { updateExerciseSetAction } from "@/lib/server/actions/update-exercise-set";
import { exerciseSetEditorSchema, type ExerciseItemEditorSchema, type ExerciseSetEditorSchema } from "@/lib/validations/exercises";
import type { ExerciseSetDetail, SpaceSectionSummary, SpaceSummary } from "@/types/domain";

export function ExerciseSetForm({
  mode,
  spaces,
  sections,
  initialValues,
}: {
  mode: "create" | "edit";
  spaces: SpaceSummary[];
  sections: SpaceSectionSummary[];
  initialValues?: ExerciseSetDetail;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ExerciseSetEditorSchema>({
    resolver: zodResolver(exerciseSetEditorSchema) as Resolver<ExerciseSetEditorSchema>,
    defaultValues: mapExerciseSetDetailToEditorValues(initialValues),
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });
  const selectedSpaceId = form.watch("space_id");
  const selectedExerciseType = form.watch("exercise_type");

  const visibleSections = useMemo(
    () => sections.filter((section) => section.spaceId === selectedSpaceId),
    [sections, selectedSpaceId],
  );

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createExerciseSetAction(values);
        } else if (initialValues) {
          await updateExerciseSetAction({
            id: initialValues.id,
            ...values,
          });
        }

        router.push("/admin/exercises");
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.tables.title")}</label>
          <Input {...form.register("title")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.slug")}</label>
          <Input {...form.register("slug")} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.instructions")}</label>
        <Textarea {...form.register("instructions")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.exerciseType")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("exercise_type")}>
            <option value="mcq">{t("practice.types.mcq")}</option>
            <option value="term_recall">{t("practice.types.termRecall")}</option>
            <option value="flashcard">{t("practice.types.flashcard")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("status")}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.class")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("space_id")}>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.section")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("section_id")}>
            <option value="">{t("admin.tables.classWide")}</option>
            {visibleSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("admin.forms.exerciseItemsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("admin.forms.exerciseItemsDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedExerciseType === "mcq" ? (
              <Button onClick={() => itemsFieldArray.append(createDefaultExerciseItem("mcq"))} size="sm" type="button" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.forms.addMcq")}
              </Button>
            ) : null}
            {selectedExerciseType === "term_recall" ? (
              <Button onClick={() => itemsFieldArray.append(createDefaultExerciseItem("spelling"))} size="sm" type="button" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.forms.addRecall")}
              </Button>
            ) : null}
            {selectedExerciseType === "flashcard" ? (
              <Button onClick={() => itemsFieldArray.append(createDefaultExerciseItem("flashcard"))} size="sm" type="button" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.forms.addFlashcard")}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="space-y-4">
          {itemsFieldArray.fields.map((field, index) => (
            <ExerciseItemBuilder
              control={form.control}
              index={index}
              item={form.watch(`items.${index}`) as ExerciseItemEditorSchema}
              key={field.id}
              onRemove={() => itemsFieldArray.remove(index)}
              register={form.register}
            />
          ))}
        </div>
      </div>
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createExerciseSet") : t("admin.forms.updateExerciseSet")}</Button>
        <Button onClick={() => router.push("/admin/exercises")} type="button" variant="outline">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
