"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import { createResourceAction } from "@/lib/server/actions/create-resource";
import { updateResourceAction } from "@/lib/server/actions/update-resource";
import {
  MAX_RESOURCE_FILE_SIZE_BYTES,
  getFileExtension,
} from "@/lib/db/storage";
import {
  createResourceSchema,
  type CreateResourceSchema,
  type UpdateResourceSchema,
  updateResourceSchema,
} from "@/lib/validations/resources";
import { formatFileSize } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { removeUploadedStorageObjects, uploadResourceFiles } from "@/services/storage-service";
import type { ResourceFileSummary, SpaceSectionSummary, SpaceSummary } from "@/types/domain";

type ResourceFormValues = CreateResourceSchema & { id?: string };

interface PendingFileDraft {
  clientId: string;
  file: File;
  fileName: string;
  fileExt: string | null;
  mimeType: string | null;
  fileSize: number | null;
}

function createPendingFileDraft(file: File): PendingFileDraft {
  return {
    clientId: crypto.randomUUID(),
    file,
    fileName: file.name,
    fileExt: getFileExtension(file.name),
    mimeType: file.type || null,
    fileSize: file.size,
  };
}

export function ResourceForm({
  mode,
  spaces,
  sections,
  initialValues,
  initialFiles = [],
}: {
  mode: "create" | "edit";
  spaces: SpaceSummary[];
  sections: SpaceSectionSummary[];
  initialValues?: Partial<UpdateResourceSchema>;
  initialFiles?: ResourceFileSummary[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<ResourceFileSummary[]>(initialFiles);
  const [pendingFiles, setPendingFiles] = useState<PendingFileDraft[]>([]);
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

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    setFormError(null);

    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_RESOURCE_FILE_SIZE_BYTES);
    if (oversizedFile) {
      setFormError(`文件 ${oversizedFile.name} 超过 25 MB 限制。`);
      event.target.value = "";
      return;
    }

    setPendingFiles((current) => [...current, ...selectedFiles.map(createPendingFileDraft)]);
    event.target.value = "";
  }

  function removeExistingFile(fileId: string) {
    setExistingFiles((current) => current.filter((file) => file.id !== fileId));
  }

  function removePendingFile(clientId: string) {
    setPendingFiles((current) => current.filter((file) => file.clientId !== clientId));
  }

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      let uploadedObjects: Array<{ bucket: string; objectPath: string }> = [];

      try {
        const selectedSpace = spaces.find((space) => space.id === values.space_id);
        if (!selectedSpace) {
          throw new Error("Selected space not found.");
        }

        const uploadedMetadata: Array<{
          file_path: string;
          file_name: string;
          file_ext: string | null;
          mime_type: string | null;
          file_size: number | null;
          preview_url: null;
          sort_order: number;
        }> = [];

        if (pendingFiles.length > 0) {
          const uploadResult = await uploadResourceFiles(selectedSpace.slug, pendingFiles);
          uploadedObjects = uploadResult.uploadedObjects;
          uploadedMetadata.push(...uploadResult.fileMetadata);
        }

        const fileMetadata = [
          ...existingFiles.map((file) => ({
            id: file.id,
            file_path: file.filePath,
            file_name: file.fileName,
            file_ext: file.fileExt,
            mime_type: file.mimeType,
            file_size: file.fileSize,
            preview_url: file.previewUrl,
            sort_order: 0,
          })),
          ...uploadedMetadata,
        ].map((file, index) => ({
          ...file,
          sort_order: index,
        }));

        const payload = {
          ...values,
          file_metadata: fileMetadata,
        };

        if (mode === "create") {
          await createResourceAction(payload);
        } else {
          await updateResourceAction(payload);
        }

        router.push("/admin/resources");
        router.refresh();
      } catch (error) {
        try {
          await removeUploadedStorageObjects(uploadedObjects);
        } catch {
          // Best-effort cleanup; surface the original submission error to the user.
        }
        setFormError(error instanceof Error ? error.message : t("admin.userTable.saveFailed"));
      }
    });
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="title">{t("admin.forms.resourceTitle")}</label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-sm text-red-600">{form.formState.errors.title.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="slug">{t("admin.forms.slug")}</label>
          <Input id="slug" {...form.register("slug")} />
          {form.formState.errors.slug ? <p className="text-sm text-red-600">{form.formState.errors.slug.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="description">{t("admin.forms.description")}</label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="space_id">{t("admin.forms.class")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="space_id" {...form.register("space_id")}>
            {spaces.map((space) => <option key={space.id} value={space.id}>{space.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="section_id">{t("admin.forms.section")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="section_id" {...form.register("section_id")}>
            <option value="">{t("admin.forms.noSection")}</option>
            {sectionOptions.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="resource_type">{t("admin.forms.resourceType")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="resource_type" {...form.register("resource_type")}>
            {["ppt","case_analysis","revision","extension","worksheet","model_answer","mock_paper","mark_scheme","other"].map((option) => (
              <option key={option} value={option}>
                {t(option === "case_analysis" ? "admin.forms.resourceTypes.caseAnalysis" : option === "model_answer" ? "admin.forms.resourceTypes.modelAnswer" : option === "mock_paper" ? "admin.forms.resourceTypes.mockPaper" : option === "mark_scheme" ? "admin.forms.resourceTypes.markScheme" : option === "revision" ? "admin.forms.resourceTypes.revision" : option === "extension" ? "admin.forms.resourceTypes.extension" : option === "worksheet" ? "admin.forms.resourceTypes.worksheet" : option === "other" ? "admin.forms.resourceTypes.other" : "admin.forms.resourceTypes.ppt")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="visibility">{t("admin.forms.visibility")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="visibility" {...form.register("visibility")}>
            <option value="space">{t("admin.forms.visibilityOptions.space")}</option>
            <option value="selected_members">{t("admin.forms.visibilityOptions.selectedMembers")}</option>
            <option value="public">{t("admin.forms.visibilityOptions.public")}</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="status">{t("admin.forms.status")}</label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" id="status" {...form.register("status")}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="published_at">{t("admin.forms.publishedAt")}</label>
          <Input id="published_at" placeholder="2025-09-15T00:00:00.000Z" {...form.register("published_at")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="sort_order">{t("admin.forms.sortOrder")}</label>
          <Input id="sort_order" type="number" {...form.register("sort_order", { valueAsNumber: true })} />
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-dashed border-border bg-slate-50 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">资源文件</p>
          <p className="text-sm text-muted-foreground">支持多文件上传，单个文件不超过 25 MB。文件保存在受保护存储中，访问时会按当前登录用户权限生成签名下载链接。</p>
        </div>
        <Input disabled={isPending} multiple onChange={handleFileSelection} type="file" />
        {existingFiles.length > 0 || pendingFiles.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-border bg-white p-3">
            {existingFiles.map((file) => (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0" key={file.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    已保存{formatFileSize(file.fileSize) ? ` · ${formatFileSize(file.fileSize)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a className="text-xs text-primary underline-offset-4 hover:underline" href={`/api/resources/${initialValues?.id ?? ""}/files/${file.id}`}>
                    下载
                  </a>
                  <Button onClick={() => removeExistingFile(file.id)} size="sm" type="button" variant="ghost">
                    {t("admin.forms.remove")}
                  </Button>
                </div>
              </div>
            ))}
            {pendingFiles.map((file) => (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0" key={file.clientId}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    待上传{formatFileSize(file.fileSize) ? ` · ${formatFileSize(file.fileSize)}` : ""}
                  </p>
                </div>
                <Button onClick={() => removePendingFile(file.clientId)} size="sm" type="button" variant="ghost">
                  {t("admin.forms.remove")}
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {mode === "edit" && initialValues?.id ? <input type="hidden" value={initialValues.id} {...form.register("id")} /> : null}
      {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
      <div className="flex gap-3">
        <Button type="submit">{isPending ? t("forms.saving") : mode === "create" ? t("admin.forms.createResource") : t("admin.forms.updateResource")}</Button>
        <Button onClick={() => router.push("/admin/resources")} type="button" variant="outline">{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
