"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { createTaskAction } from "@/lib/server/actions/create-task";
import { deleteTaskAction } from "@/lib/server/actions/delete-task";
import { updateTaskAction } from "@/lib/server/actions/update-task";
import {
  createTaskSchema,
  type CreateTaskSchema,
  type UpdateTaskSchema,
  updateTaskSchema,
} from "@/lib/validations/electives";
import { fromShanghaiDateTimeInputValue, toShanghaiDateTimeInputValue } from "@/lib/utils/timezone";
import type { ResourceSummary, SpaceSummary, TaskSummary } from "@/types/domain";

export function TaskForm({
  mode,
  spaceId,
  spaceType,
  resources,
  spaces,
  initialValues,
}: {
  mode: "create" | "edit";
  spaceId: string;
  spaceType: "class" | "elective";
  resources: ResourceSummary[];
  spaces?: SpaceSummary[];
  initialValues?: Partial<TaskSummary> & { id?: string };
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateTaskSchema | UpdateTaskSchema>({
    resolver: zodResolver(mode === "create" ? createTaskSchema : updateTaskSchema) as Resolver<CreateTaskSchema | UpdateTaskSchema>,
    defaultValues: {
      space_id: spaceId,
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      brief: initialValues?.brief ?? "",
      body: initialValues?.body ?? "",
      submission_mode: initialValues?.submissionMode ?? (spaceType === "class" ? "individual" : "group"),
      due_at: toShanghaiDateTimeInputValue(initialValues?.dueAt),
      allow_resubmission: initialValues?.allowResubmission ?? true,
      template_resource_id: initialValues?.templateResourceId ?? "",
      status: initialValues?.status ?? "draft",
      ...(mode === "edit" && initialValues?.id ? { id: initialValues.id } : {}),
    },
  });
  const selectedSpaceId = form.watch("space_id");
  const resourceOptions = useMemo(
    () => resources.filter((resource) => resource.spaceId === selectedSpaceId),
    [resources, selectedSpaceId],
  );

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          space_id: values.space_id,
          due_at: fromShanghaiDateTimeInputValue(values.due_at ?? null),
          template_resource_id: values.template_resource_id || null,
        };

        if (mode === "create") {
          await createTaskAction(payload);
          const resetSpaceId = values.space_id;
          form.reset({
            space_id: resetSpaceId,
            title: "",
            slug: "",
            brief: "",
            body: "",
            submission_mode: spaceType === "class" ? "individual" : "group",
            due_at: "",
            allow_resubmission: true,
            template_resource_id: "",
            status: "draft",
          });
        } else {
          await updateTaskAction(payload);
        }

        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  const onDelete = () => {
    if (mode !== "edit" || !initialValues?.id || isPending || !window.confirm(t("admin.tasks.deleteConfirm"))) {
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        await deleteTaskAction(initialValues.id!);
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {mode === "create" && spaces && spaces.length > 0 ? (
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
      ) : (
        <input type="hidden" value={spaceId} {...form.register("space_id")} />
      )}
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.taskTitle")}</label>
          <Input {...form.register("title")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.slug")}</label>
          <Input {...form.register("slug")} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.brief")}</label>
        <Textarea {...form.register("brief")} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.instructions")}</label>
        <Textarea {...form.register("body")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.submissionMode")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("submission_mode")}>
            {spaceType === "elective" ? <option value="group">{t("admin.forms.groupSubmission")}</option> : null}
            <option value="individual">{t("admin.forms.individualSubmission")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.dueAt")}</label>
          <Input type="datetime-local" {...form.register("due_at")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.templateResource")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("template_resource_id")}>
            <option value="">{t("admin.forms.none")}</option>
            {resourceOptions.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("status")}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm">
        <input className="h-4 w-4 rounded border-border" type="checkbox" {...form.register("allow_resubmission")} />
        {t("admin.forms.allowResubmission")}
      </label>
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createTask") : t("admin.forms.updateTask")}</Button>
        {mode === "edit" && initialValues?.id ? (
          <Button onClick={onDelete} type="button" variant="outline">
            {t("common.delete")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
