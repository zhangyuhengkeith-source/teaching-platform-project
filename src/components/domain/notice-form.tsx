"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { createNoticeAction } from "@/lib/server/actions/create-notice";
import { updateNoticeAction } from "@/lib/server/actions/update-notice";
import { createNoticeSchema, type CreateNoticeSchema, type UpdateNoticeSchema, updateNoticeSchema } from "@/lib/validations/notices";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(mode === "create" ? createNoticeSchema : updateNoticeSchema) as Resolver<NoticeFormValues>,
    defaultValues: {
      space_id: initialValues?.space_id ?? spaces[0]?.id ?? "",
      title: initialValues?.title ?? "",
      body: initialValues?.body ?? "",
      notice_type: initialValues?.notice_type ?? "general",
      publish_at: initialValues?.publish_at ?? "",
      expire_at: initialValues?.expire_at ?? "",
      is_pinned: initialValues?.is_pinned ?? false,
      status: initialValues?.status ?? "draft",
      ...(mode === "edit" && initialValues?.id ? { id: initialValues.id } : {}),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createNoticeAction(values);
        } else {
          await updateNoticeAction(values);
        }

        router.push("/admin/notices");
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to save notice.");
      }
    });
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">Notice title</label>
          <Input id="title" {...form.register("title")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="space_id">Class</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="space_id" {...form.register("space_id")}>
            {spaces.map((space) => <option key={space.id} value={space.id}>{space.title}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="body">Body</label>
        <Textarea id="body" {...form.register("body")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="notice_type">Notice type</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="notice_type" {...form.register("notice_type")}>
            {["homework","deadline","mock_exam","general","grouping","service_update"].map((option) => (
              <option key={option} value={option}>{option.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="status" {...form.register("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="publish_at">Publish at</label>
          <Input id="publish_at" placeholder="2025-09-15T00:00:00.000Z" {...form.register("publish_at")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="expire_at">Expire at</label>
          <Input id="expire_at" placeholder="2025-10-01T00:00:00.000Z" {...form.register("expire_at")} />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <Controller
          control={form.control}
          name="is_pinned"
          render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
        />
        <div>
          <p className="text-sm font-medium">Pin this notice</p>
          <p className="text-xs text-muted-foreground">Pinned notices appear more prominently in the class space.</p>
        </div>
      </div>
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? "Saving..." : mode === "create" ? "Create notice" : "Update notice"}</Button>
        <Button onClick={() => router.push("/admin/notices")} type="button" variant="outline">Cancel</Button>
      </div>
    </form>
  );
}
