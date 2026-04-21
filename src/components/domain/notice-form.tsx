"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { createNoticeAction } from "@/lib/server/actions/create-notice";
import { deleteNoticeAction } from "@/lib/server/actions/delete-notice";
import { updateNoticeAction } from "@/lib/server/actions/update-notice";
import { createNoticeSchema, type CreateNoticeSchema, type UpdateNoticeSchema, updateNoticeSchema } from "@/lib/validations/notices";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { fromShanghaiDateTimeInputValue, toShanghaiDateTimeInputValue } from "@/lib/utils/timezone";
import type { SpaceSummary } from "@/types/domain";

type NoticeFormValues = CreateNoticeSchema & { id?: string };

export function NoticeForm({
  mode,
  spaces,
  initialValues,
}: {
  mode: "create" | "edit";
  spaces: SpaceSummary[];
  initialValues?: Partial<UpdateNoticeSchema>;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(mode === "create" ? createNoticeSchema : updateNoticeSchema) as Resolver<NoticeFormValues>,
    defaultValues: {
      space_id: initialValues?.space_id ?? spaces[0]?.id ?? "",
      title: initialValues?.title ?? "",
      body: initialValues?.body ?? "",
      notice_type: initialValues?.notice_type ?? "general",
      publish_at: toShanghaiDateTimeInputValue(initialValues?.publish_at),
      expire_at: toShanghaiDateTimeInputValue(initialValues?.expire_at),
      is_pinned: initialValues?.is_pinned ?? false,
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
          publish_at: fromShanghaiDateTimeInputValue(values.publish_at ?? null),
          expire_at: fromShanghaiDateTimeInputValue(values.expire_at ?? null),
        };

        if (mode === "create") {
          await createNoticeAction(payload);
        } else {
          await updateNoticeAction(payload);
        }

        router.push("/admin/notices");
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  const onDelete = () => {
    if (mode !== "edit" || !initialValues?.id || isPending || !window.confirm(t("admin.notices.deleteConfirm"))) {
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        await deleteNoticeAction(initialValues.id!);
        router.push("/admin/notices");
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">{t("admin.forms.noticeTitle")}</label>
          <Input id="title" {...form.register("title")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="space_id">{t("admin.forms.class")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="space_id" {...form.register("space_id")}>
            {spaces.map((space) => <option key={space.id} value={space.id}>{space.title}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="body">{t("admin.forms.body")}</label>
        <Textarea id="body" {...form.register("body")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="notice_type">{t("admin.forms.noticeType")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="notice_type" {...form.register("notice_type")}>
            {["homework","deadline","mock_exam","general","grouping","service_update"].map((option) => (
              <option key={option} value={option}>
                {t(option === "mock_exam" ? "admin.forms.noticeTypes.mockExam" : option === "service_update" ? "admin.forms.noticeTypes.serviceUpdate" : option === "homework" ? "admin.forms.noticeTypes.homework" : option === "deadline" ? "admin.forms.noticeTypes.deadline" : option === "grouping" ? "admin.forms.noticeTypes.grouping" : "admin.forms.noticeTypes.general")}
              </option>
            ))}
          </select>
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
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="publish_at">{t("admin.forms.publishAt")}</label>
          <Input id="publish_at" type="datetime-local" {...form.register("publish_at")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="expire_at">{t("admin.forms.expireAt")}</label>
          <Input id="expire_at" type="datetime-local" {...form.register("expire_at")} />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <Controller
          control={form.control}
          name="is_pinned"
          render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
        />
        <div>
          <p className="text-sm font-medium">{t("admin.forms.pinNotice")}</p>
          <p className="text-xs text-muted-foreground">{t("admin.forms.pinNoticeHint")}</p>
        </div>
      </div>
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createNotice") : t("admin.forms.updateNotice")}</Button>
        {mode === "edit" && initialValues?.id ? (
          <Button onClick={onDelete} type="button" variant="outline">{t("common.delete")}</Button>
        ) : null}
        <Button onClick={() => router.push("/admin/notices")} type="button" variant="outline">{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
