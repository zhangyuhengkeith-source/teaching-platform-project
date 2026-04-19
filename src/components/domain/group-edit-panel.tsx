"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { createGroupAction } from "@/lib/server/actions/create-group";
import { updateGroupAction } from "@/lib/server/actions/update-group";
import {
  createGroupSchema,
  type CreateGroupSchema,
  type UpdateGroupSchema,
  updateGroupSchema,
} from "@/lib/validations/electives";

export function GroupEditPanel({
  mode,
  spaceId,
  initialValues,
  showStatusField = false,
}: {
  mode: "create" | "edit";
  spaceId: string;
  initialValues?: Partial<UpdateGroupSchema>;
  showStatusField?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateGroupSchema | UpdateGroupSchema>({
    resolver: zodResolver(mode === "create" ? createGroupSchema : updateGroupSchema),
    defaultValues: {
      space_id: spaceId,
      name: initialValues?.name ?? "",
      slug: initialValues?.slug ?? "",
      project_title: initialValues?.project_title ?? "",
      project_summary: initialValues?.project_summary ?? "",
      status: initialValues?.status ?? "forming",
      ...(mode === "edit" && initialValues?.id ? { id: initialValues.id } : {}),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        const result = mode === "create" ? await createGroupAction(values) : await updateGroupAction(values);

        if (!result.ok) {
          setFormError(result.error ?? t("admin.userTable.saveFailed"));
          return;
        }

        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <input type="hidden" value={spaceId} {...form.register("space_id")} />
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.groupName")}</label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.slug")}</label>
          <Input {...form.register("slug")} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.projectTitle")}</label>
        <Input {...form.register("project_title")} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.projectSummary")}</label>
        <Textarea {...form.register("project_summary")} />
      </div>
      {showStatusField ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("status")}>
            <option value="forming">{t("status.forming")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="locked">{t("status.locked")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
        </div>
      ) : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createGroup") : t("admin.forms.updateGroup")}</Button>
    </form>
  );
}
