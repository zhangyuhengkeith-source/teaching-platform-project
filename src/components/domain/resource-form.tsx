"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { createResourceAction } from "@/lib/server/actions/create-resource";
import { updateResourceAction } from "@/lib/server/actions/update-resource";
import { createResourceSchema, type CreateResourceSchema, type UpdateResourceSchema, updateResourceSchema } from "@/lib/validations/resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SpaceSectionSummary, SpaceSummary } from "@/types/domain";

type ResourceFormValues = CreateResourceSchema & { id?: string };

export function ResourceForm({
  mode,
  spaces,
  sections,
  initialValues,
}: {
  mode: "create" | "edit";
  spaces: SpaceSummary[];
  sections: SpaceSectionSummary[];
  initialValues?: Partial<UpdateResourceSchema>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(mode === "create" ? createResourceSchema : updateResourceSchema) as Resolver<ResourceFormValues>,
    defaultValues: {
      space_id: initialValues?.space_id ?? spaces[0]?.id ?? "",
      section_id: initialValues?.section_id ?? null,
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      description: initialValues?.description ?? "",
      resource_type: initialValues?.resource_type ?? "ppt",
      visibility: initialValues?.visibility ?? "space",
      status: initialValues?.status ?? "draft",
      published_at: initialValues?.published_at ?? "",
      sort_order: initialValues?.sort_order ?? 0,
      ...(mode === "edit" && initialValues?.id ? { id: initialValues.id } : {}),
    },
  });

  const selectedSpaceId = form.watch("space_id");
  const sectionOptions = useMemo(() => sections.filter((section) => section.spaceId === selectedSpaceId), [sections, selectedSpaceId]);

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createResourceAction(values);
        } else {
          await updateResourceAction(values);
        }

        router.push("/admin/resources");
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to save resource.");
      }
    });
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">Resource title</label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-sm text-red-600">{form.formState.errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="slug">Slug</label>
          <Input id="slug" {...form.register("slug")} />
          {form.formState.errors.slug ? <p className="text-sm text-red-600">{form.formState.errors.slug.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">Description</label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="space_id">Class</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="space_id" {...form.register("space_id")}>
            {spaces.map((space) => <option key={space.id} value={space.id}>{space.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="section_id">Section</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="section_id" {...form.register("section_id")}>
            <option value="">No section</option>
            {sectionOptions.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="resource_type">Resource type</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="resource_type" {...form.register("resource_type")}>
            {["ppt","case_analysis","revision","extension","worksheet","model_answer","mock_paper","mark_scheme","other"].map((option) => (
              <option key={option} value={option}>{option.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="visibility">Visibility</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="visibility" {...form.register("visibility")}>
            <option value="space">Space</option>
            <option value="selected_members">Selected members</option>
            <option value="public">Public</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="status" {...form.register("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="published_at">Published at</label>
          <Input id="published_at" placeholder="2025-09-15T00:00:00.000Z" {...form.register("published_at")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="sort_order">Sort order</label>
          <Input id="sort_order" type="number" {...form.register("sort_order", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm text-muted-foreground">
        File upload is intentionally deferred. Resource files will attach here in the next storage-focused slice.
      </div>
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? "Saving..." : mode === "create" ? "Create resource" : "Update resource"}</Button>
        <Button onClick={() => router.push("/admin/resources")} type="button" variant="outline">Cancel</Button>
      </div>
    </form>
  );
}
