"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  buildClassSlug,
  CLASS_SUBJECTS,
  getClassSubjectFromSlug,
  getClassSubjectLabel,
} from "@/lib/constants/class-subjects";
import { createSpaceAction } from "@/lib/server/actions/create-space";
import { updateSpaceAction } from "@/lib/server/actions/update-space";
import { type UpdateSpaceSchema } from "@/lib/validations/spaces";
import {
  createClassFormSchema,
  type CreateClassFormSchema,
  type UpdateClassFormSchema,
  updateClassFormSchema,
} from "@/lib/validations/class-space";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";

export function ClassForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<UpdateSpaceSchema>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateClassFormSchema | UpdateClassFormSchema>({
    resolver: zodResolver(mode === "create" ? createClassFormSchema : updateClassFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      subject: getClassSubjectFromSlug(initialValues?.slug) ?? undefined,
      description: initialValues?.description ?? "",
      academic_year: initialValues?.academic_year ?? "",
      status: initialValues?.status ?? "draft",
      ...(mode === "edit" && initialValues?.id ? { id: initialValues.id } : {}),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        const payload = {
          ...values,
          slug: buildClassSlug(values.subject, values.title, values.academic_year),
          type: "class" as const,
        };

        if (mode === "create") {
          await createSpaceAction(payload);
        } else {
          await updateSpaceAction(payload);
        }

        router.push("/admin/classes");
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  const watchedTitle = form.watch("title");
  const watchedSubject = form.watch("subject");
  const watchedAcademicYear = form.watch("academic_year");
  const generatedSlug = watchedSubject ? buildClassSlug(watchedSubject, watchedTitle, watchedAcademicYear) : "";

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">{t("admin.forms.classTitle")}</label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-sm text-red-600">{form.formState.errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="subject">学科/subject</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="subject" {...form.register("subject")}>
            <option value="">请选择学科</option>
            {CLASS_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {getClassSubjectLabel(subject)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            系统会自动生成班级链接 slug{generatedSlug ? `：${generatedSlug}` : "。"}
          </p>
          {form.formState.errors.subject ? <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">{t("admin.forms.description")}</label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="academic_year">{t("admin.forms.academicYear")}</label>
          <Input id="academic_year" placeholder="2025-2026" {...form.register("academic_year")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="status">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="status" {...form.register("status")}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
        </div>
      </div>
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createClass") : t("admin.forms.updateClass")}</Button>
        <Button onClick={() => router.push("/admin/classes")} type="button" variant="outline">{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
