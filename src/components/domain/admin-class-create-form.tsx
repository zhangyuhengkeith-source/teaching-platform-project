"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createManagedClassAction } from "@/lib/server/actions/create-managed-class";
import { createSpaceSchema, type CreateSpaceSchema } from "@/lib/validations/spaces";

export function AdminClassCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateSpaceSchema>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      title: "",
      slug: "",
      type: "class",
      description: "",
      academic_year: "",
      status: "draft",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        await createManagedClassAction({ ...values, type: "class" });
        form.reset({
          title: "",
          slug: "",
          type: "class",
          description: "",
          academic_year: "",
          status: "draft",
        });
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to create class.");
      }
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-title">Class title</label>
          <Input id="managed-class-title" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-sm text-red-600">{form.formState.errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-slug">Slug</label>
          <Input id="managed-class-slug" {...form.register("slug")} />
          {form.formState.errors.slug ? <p className="text-sm text-red-600">{form.formState.errors.slug.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="managed-class-description">Description</label>
        <Textarea id="managed-class-description" rows={3} {...form.register("description")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-year">Academic year</label>
          <Input id="managed-class-year" placeholder="2026-2027" {...form.register("academic_year")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="managed-class-status">Status</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="managed-class-status" {...form.register("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <Button type="submit">{isPending ? "Creating..." : "Create class"}</Button>
    </form>
  );
}
