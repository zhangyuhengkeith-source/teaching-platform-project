"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { buildClassSlug, CLASS_SUBJECTS, getClassSubjectLabel } from "@/lib/constants/class-subjects";
import { createManagedClassAction } from "@/lib/server/actions/create-managed-class";
import { createClassFormSchema, type CreateClassFormSchema } from "@/lib/validations/class-space";

export function AdminClassCreateForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateClassFormSchema>({
    resolver: zodResolver(createClassFormSchema),
    defaultValues: {
      title: "",
      subject: undefined,
      description: "",
      academic_year: "",
      status: "draft",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        await createManagedClassAction({
          ...values,
          slug: buildClassSlug(values.subject, values.title, values.academic_year),
          type: "class",
        });
        form.reset({
          title: "",
          subject: undefined,
          description: "",
          academic_year: "",
          status: "draft",
        });
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("forms.unableToSaveSubmission"));
      }
    });
  });

  const watchedTitle = form.watch("title");
  const watchedSubject = form.watch("subject");
  const watchedAcademicYear = form.watch("academic_year");
  const generatedSlug = watchedSubject ? buildClassSlug(watchedSubject, watchedTitle, watchedAcademicYear) : "";

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-title">{t("admin.forms.classTitle")}</label>
          <Input id="managed-class-title" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-sm text-red-600">{form.formState.errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-subject">学科/subject</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="managed-class-subject" {...form.register("subject")}>
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
        <label className="text-sm font-medium" htmlFor="managed-class-description">{t("admin.forms.description")}</label>
        <Textarea id="managed-class-description" rows={3} {...form.register("description")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-year">{t("admin.forms.academicYear")}</label>
          <Input id="managed-class-year" placeholder="2026-2027" {...form.register("academic_year")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-status">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="managed-class-status" {...form.register("status")}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
        </div>
      </div>
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <Button type="submit">{isPending ? t("forms.saving") : t("admin.forms.createClass")}</Button>
    </form>
  );
}
