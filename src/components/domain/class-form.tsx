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
  const [formMessage, setFormMessage] = useState<string | null>(null);
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
    setFormMessage(null);

    startTransition(async () => {
      try {
        const payload = {
          ...values,
          slug: buildClassSlug(values.subject, values.title, values.academic_year),
          type: "class" as const,
        };

        if (mode === "create") {
          const result = await createSpaceAction(payload);
          if (!result.ok) {
            setFormError(result.error ?? t("admin.userTable.saveFailed"));
            return;
          }
        } else {
          const result = await updateSpaceAction(payload);
          if (!result.ok) {
            setFormError(result.error ?? t("admin.userTable.saveFailed"));
            return;
          }

          if (result.pendingApproval) {
            setFormMessage("班级编辑已提交超管审批。审批通过前，班级名称、学科、描述、学年和状态会保持提交前不变。");
            return;
          }
        }

        router.push("/admin");
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
      {mode === "edit" ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          教师修改班级名称、学科、描述、学年或状态后，需要超管审批。审批通过前，学生端和班级管理状态保持当前版本不变。
        </p>
      ) : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      {formMessage ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{formMessage}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createClass") : t("admin.forms.updateClass")}</Button>
        <Button onClick={() => router.push("/admin")} type="button" variant="outline">{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
