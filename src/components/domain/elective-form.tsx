"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { createElectiveAction } from "@/lib/server/actions/create-elective";
import { updateElectiveAction } from "@/lib/server/actions/update-elective";
import {
  createElectiveSchema,
  type CreateElectiveSchema,
  type UpdateElectiveSchema,
  updateElectiveSchema,
} from "@/lib/validations/electives";

export function ElectiveForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<UpdateElectiveSchema>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateElectiveSchema | UpdateElectiveSchema>({
    resolver: zodResolver(mode === "create" ? createElectiveSchema : updateElectiveSchema) as Resolver<CreateElectiveSchema | UpdateElectiveSchema>,
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      description: initialValues?.description ?? "",
      academic_year: initialValues?.academic_year ?? "",
      status: initialValues?.status ?? "draft",
      grouping_locked: initialValues?.grouping_locked ?? false,
      max_group_size: initialValues?.max_group_size ?? 4,
      ...(mode === "edit" && initialValues?.id ? { id: initialValues.id } : {}),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createElectiveAction(values);
          if (!result.ok) {
            setFormError(result.error ?? t("admin.userTable.saveFailed"));
            return;
          }
        } else {
          const result = await updateElectiveAction(values);
          if (!result.ok) {
            setFormError(result.error ?? t("admin.userTable.saveFailed"));
            return;
          }
        }
        router.push("/admin/electives");
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className={`grid gap-6 ${mode === "edit" ? "md:grid-cols-2" : ""}`}>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.electiveTitle")}</label>
          <Input {...form.register("title")} />
        </div>
        {mode === "edit" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.forms.slug")}</label>
            <Input {...form.register("slug")} />
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
            Slug will be generated automatically when this elective is created.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("admin.forms.description")}</label>
        <Textarea {...form.register("description")} />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.academicYear")}</label>
          <Input placeholder="2025-2026" {...form.register("academic_year")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" {...form.register("status")}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.forms.maxGroupSize")}</label>
          <Input type="number" {...form.register("max_group_size", { valueAsNumber: true })} />
        </div>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm">
        <input className="h-4 w-4 rounded border-border" type="checkbox" {...form.register("grouping_locked")} />
        {t("admin.forms.lockGrouping")}
      </label>
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createElective") : t("admin.forms.updateElective")}</Button>
        <Button onClick={() => router.push("/admin/electives")} type="button" variant="outline">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
