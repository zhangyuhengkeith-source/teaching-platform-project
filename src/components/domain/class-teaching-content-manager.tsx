"use client";

import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Archive, BarChart3, CalendarClock, CheckCircle2, FilePlus2, Pencil, Plus, Rocket, Trash2, XCircle } from "lucide-react";

import { ExerciseItemBuilder } from "@/components/domain/exercise-item-builder";
import { ClassManagementPageHeader } from "@/components/domain/class-management-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { MAX_RESOURCE_FILE_SIZE_BYTES, getFileExtension } from "@/lib/db/storage";
import { formatFileSize } from "@/lib/utils/format";
import { fromShanghaiDateTimeInputValue, formatInShanghai, toShanghaiDateTimeInputValue } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils/cn";
import { removeUploadedStorageObjects, uploadResourceFiles } from "@/services/storage-service";
import { createDefaultExerciseItem, getDefaultExerciseItemType, mapExerciseSetDetailToEditorValues } from "@/lib/exercises/editor";
import type { ExerciseSetEditorSchema } from "@/lib/validations/exercises";
import type {
  CourseChapterItemSummary,
  ExerciseSetDetail,
  ExerciseSetSummary,
  PracticeSetProgressMetric,
  PracticeSetProgressSetSummary,
  PracticeSetProgressSummary,
  ResourceSummary,
  SpaceSummary,
  TaskSummary,
} from "@/types/domain";

type ModuleKind = "resources" | "tasks" | "practice-sets";
type ListMode = "published" | "drafts" | "archived";
type ContentItem = ResourceSummary | TaskSummary | ExerciseSetSummary | ExerciseSetDetail;
type PracticeSetSubmitPayload = {
  chapter_id: string | null;
  title: string;
  slug?: string;
  instructions: string | null;
  exercise_type: ExerciseSetEditorSchema["exercise_type"];
  publish_at: string | null;
  status?: ExerciseSetEditorSchema["status"];
  items: ExerciseSetEditorSchema["items"];
};

interface ClassTeachingContentManagerProps {
  classSpace: SpaceSummary;
  module: ModuleKind;
  isAdmin: boolean;
  chapters: CourseChapterItemSummary[];
  initialItems: ContentItem[];
  practiceSetProgress?: PracticeSetProgressSummary;
}

const moduleConfig = {
  resources: {
    title: "Course Resources",
    description: "Manage published and scheduled learning resources for this class.",
    createLabel: "Create resource",
    emptyTitle: "No resources",
    emptyDescription: "Create or schedule the first course resource for this class.",
    typeLabel: "Resource type",
    typeField: "resource_type",
    types: [
      ["ppt", "PPT"],
      ["case_analysis", "Case analysis"],
      ["revision", "Revision"],
      ["extension", "Extension"],
      ["worksheet", "Worksheet"],
      ["model_answer", "Model answer"],
      ["mock_paper", "Mock paper"],
      ["mark_scheme", "Mark scheme"],
      ["other", "Other"],
    ],
  },
  tasks: {
    title: "Course Tasks",
    description: "Manage published, scheduled, overdue, and archived class tasks.",
    createLabel: "Create task",
    emptyTitle: "No tasks",
    emptyDescription: "Create or schedule the first course task for this class.",
    typeLabel: "Submission type",
    typeField: "submission_mode",
    types: [
      ["individual", "Individual"],
      ["group", "Group"],
    ],
  },
  "practice-sets": {
    title: "Course Practice Sets",
    description: "Manage published and scheduled practice sets for this class.",
    createLabel: "Create practice set",
    emptyTitle: "No practice sets",
    emptyDescription: "Create or schedule the first practice set for this class.",
    typeLabel: "Practice type",
    typeField: "exercise_type",
    types: [
      ["mcq", "Multiple choice"],
      ["term_recall", "Term recall"],
      ["flashcard", "Flashcard"],
    ],
  },
} satisfies Record<ModuleKind, {
  title: string;
  description: string;
  createLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  typeLabel: string;
  typeField: string;
  types: Array<[string, string]>;
}>;

function getItemType(module: ModuleKind, item: ContentItem) {
  if (module === "resources") {
    return (item as ResourceSummary).resourceType;
  }
  if (module === "tasks") {
    return (item as TaskSummary).submissionMode;
  }
  return (item as ExerciseSetSummary).exerciseType;
}

function getItemChapterId(item: ContentItem) {
  return item.chapterId ?? null;
}

function getItemPublishAt(item: ContentItem) {
  return item.publishAt ?? ("publishedAt" in item ? item.publishedAt : null);
}

function getItemDeadline(item: ContentItem) {
  return "deadline" in item ? item.deadline ?? item.dueAt : null;
}

function isOverdueTask(module: ModuleKind, item: ContentItem) {
  const deadline = module === "tasks" ? getItemDeadline(item) : null;
  return Boolean(deadline && item.status !== "archived" && item.status !== "deleted" && new Date(deadline).getTime() < Date.now());
}

function createSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || `item-${Date.now()}`;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export function ClassTeachingContentManager({
  classSpace,
  module,
  isAdmin,
  chapters,
  initialItems,
  practiceSetProgress,
}: ClassTeachingContentManagerProps) {
  const config = moduleConfig[module];
  const [items, setItems] = useState(initialItems);
  const [mode, setMode] = useState<ListMode>("published");
  const [chapterFilter, setChapterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [progressItemId, setProgressItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const apiBase = `/api/admin/classes/${classSpace.id}/${module}`;
  const selectedPracticeSetProgress = progressItemId ? practiceSetProgress?.sets.find((entry) => entry.exerciseSetId === progressItemId) ?? null : null;

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (chapterFilter && getItemChapterId(item) !== chapterFilter) {
        return false;
      }
      if (typeFilter && getItemType(module, item) !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [chapterFilter, items, module, typeFilter]);

  function runOperation(operation: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await operation();
      } catch (operationError) {
        setError(operationError instanceof Error ? operationError.message : "Request failed.");
      }
    });
  }

  async function reload(nextMode = mode) {
    const params = new URLSearchParams({ mode: nextMode });
    if (chapterFilter) {
      params.set("chapter_id", chapterFilter);
    }
    if (typeFilter) {
      params.set("type", typeFilter);
    }

    const response = await fetch(`${apiBase}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    const body = (await response.json()) as { items: ContentItem[] };
    setItems(body.items);
  }

  async function submitForm(formData: FormData, item?: ContentItem | null) {
    let uploadedObjects: Array<{ bucket: string; objectPath: string }> = [];
    const title = String(formData.get("title") ?? "").trim();
    const publishAt = fromShanghaiDateTimeInputValue(String(formData.get("publish_at") ?? ""));
    const payload: Record<string, unknown> = {
      title,
      chapter_id: String(formData.get("chapter_id") ?? "") || null,
      publish_at: publishAt,
    };
    const slug = String(formData.get("slug") ?? "").trim();
    if (item && slug) {
      payload.slug = slug;
    }

    if (module === "resources") {
      const selectedFiles = formData
        .getAll("resource_files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      const oversizedFile = selectedFiles.find((file) => file.size > MAX_RESOURCE_FILE_SIZE_BYTES);

      if (oversizedFile) {
        throw new Error(`File "${oversizedFile.name}" exceeds the 25 MB limit.`);
      }

      if (selectedFiles.length > 0) {
        const existingFileMetadata = item && module === "resources"
          ? ((item as ResourceSummary).files ?? []).map((file, index) => ({
              id: file.id,
              file_path: file.filePath,
              file_name: file.fileName,
              file_ext: file.fileExt,
              mime_type: file.mimeType,
              file_size: file.fileSize,
              preview_url: file.previewUrl,
              sort_order: index,
            }))
          : [];
        const uploadResult = await uploadResourceFiles(
          classSpace.slug,
          selectedFiles.map((file) => ({
            file,
            fileName: file.name,
            fileExt: getFileExtension(file.name),
            mimeType: file.type || null,
            fileSize: file.size,
          })),
        );
        uploadedObjects = uploadResult.uploadedObjects;
        payload.file_metadata = [
          ...existingFileMetadata,
          ...uploadResult.fileMetadata,
        ].map((file, index) => ({
          ...file,
          sort_order: index,
        }));
      }

      payload.description = String(formData.get("description") ?? "").trim() || null;
      payload.resource_type = String(formData.get("type") ?? "other");
    } else if (module === "tasks") {
      payload.body = String(formData.get("body") ?? "").trim() || null;
      payload.submission_mode = String(formData.get("type") ?? "individual");
      payload.deadline = fromShanghaiDateTimeInputValue(String(formData.get("deadline") ?? ""));
      payload.allow_resubmission = formData.get("allow_resubmission") === "on";
    } else {
      payload.instructions = String(formData.get("instructions") ?? "").trim() || null;
      payload.exercise_type = String(formData.get("type") ?? "mcq");
    }

    try {
      const response = await fetch(item ? `${apiBase}/${item.id}` : apiBase, {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
    } catch (submitError) {
      await removeUploadedStorageObjects(uploadedObjects);
      throw submitError;
    }

    await reload();
    setEditingItem(null);
    setMessage(item ? `${config.title} item saved.` : `${config.title} item created.`);
  }

  async function submitPracticeSet(payload: PracticeSetSubmitPayload, item?: ContentItem | null) {
    const response = await fetch(item ? `${apiBase}/${item.id}` : apiBase, {
      method: item ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setEditingItem(null);
    setMessage(item ? "Practice set saved." : "Practice set created.");
  }

  async function openEditor(item: ContentItem) {
    if (module !== "practice-sets") {
      setEditingItem(item);
      return;
    }

    const response = await fetch(`${apiBase}/${item.id}`);
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const body = (await response.json()) as { item: ExerciseSetDetail };
    setEditingItem(body.item);
  }

  async function patchAction(item: ContentItem, action: "archive" | "publish_now" | "reschedule", publishAt?: string | null) {
    const response = await fetch(`${apiBase}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, publish_at: publishAt ?? null }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setMessage(action === "archive" ? "Item archived." : action === "publish_now" ? "Item published." : "Schedule updated.");
  }

  async function deleteItem(item: ContentItem) {
    const response = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    await reload();
    setMessage("Item deleted.");
  }

  function canShowArchived() {
    return module === "tasks" || isAdmin;
  }

  return (
    <div className="space-y-6">
      <ClassManagementPageHeader
        classSpace={classSpace}
        description={config.description}
        showBackToModules
        title={config.title}
      />

      {module === "practice-sets" && practiceSetProgress ? (
        <PracticeSetProgressDashboard summary={practiceSetProgress} />
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button">
                <FilePlus2 className="mr-2 h-4 w-4" />
                {config.createLabel}
              </Button>
            </DialogTrigger>
            {module === "practice-sets" ? (
              <PracticeSetFormDialog
                chapters={chapters}
                classId={classSpace.id}
                isPending={isPending}
                onSubmit={(payload) => runOperation(() => submitPracticeSet(payload))}
              />
            ) : (
              <ContentFormDialog
                config={config}
                isPending={isPending}
                module={module}
                chapters={chapters}
                onSubmit={(formData) => runOperation(() => submitForm(formData))}
              />
            )}
          </Dialog>
          <Button
            onClick={() => {
              setMode("drafts");
              runOperation(() => reload("drafts"));
            }}
            type="button"
            variant={mode === "drafts" ? "secondary" : "outline"}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Drafts
          </Button>
          {canShowArchived() ? (
            <Button
              onClick={() => {
                setMode("archived");
                runOperation(() => reload("archived"));
              }}
              type="button"
              variant={mode === "archived" ? "secondary" : "outline"}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setMode("published");
              runOperation(() => reload("published"));
            }}
            type="button"
            variant={mode === "published" ? "secondary" : "outline"}
          >
            Published
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <select
            className="flex h-10 rounded-xl border border-input bg-white px-3 py-2 text-sm"
            onChange={(event) => setChapterFilter(event.target.value)}
            value={chapterFilter}
          >
            <option value="">All chapters</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {"- ".repeat(chapter.level - 1)}{chapter.title}
              </option>
            ))}
          </select>
          <select
            className="flex h-10 rounded-xl border border-input bg-white px-3 py-2 text-sm"
            onChange={(event) => setTypeFilter(event.target.value)}
            value={typeFilter}
          >
            <option value="">All types</option>
            {config.types.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <SectionCard description={`${visibleItems.length} item${visibleItems.length === 1 ? "" : "s"} in ${mode}.`} title={config.title}>
        {visibleItems.length === 0 ? (
          <EmptyState
            description={config.emptyDescription}
            icon={FilePlus2}
            title={config.emptyTitle}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleItems.map((item) => (
              <ContentCard
                config={config}
                isAdmin={isAdmin}
                isPending={isPending}
                item={item}
                key={item.id}
                mode={mode}
                module={module}
                onArchive={() => runOperation(() => patchAction(item, "archive"))}
                onDelete={() => {
                  if (window.confirm(`Delete "${item.title}"? Students will be notified once.`)) {
                    runOperation(() => deleteItem(item));
                  }
                }}
                onEdit={() => runOperation(() => openEditor(item))}
                onPublishNow={() => runOperation(() => patchAction(item, "publish_now"))}
                onViewProgress={module === "practice-sets" ? () => setProgressItemId(item.id) : undefined}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <Dialog onOpenChange={(open) => !open && setEditingItem(null)} open={Boolean(editingItem)}>
        {editingItem ? (
          module === "practice-sets" ? (
            <PracticeSetFormDialog
              chapters={chapters}
              classId={classSpace.id}
              initialItem={editingItem as ExerciseSetDetail}
              isPending={isPending}
              onSubmit={(payload) => runOperation(() => submitPracticeSet(payload, editingItem))}
            />
          ) : (
            <ContentFormDialog
              config={config}
              initialItem={editingItem}
              isPending={isPending}
              module={module}
              chapters={chapters}
              onSubmit={(formData) => runOperation(() => submitForm(formData, editingItem))}
            />
          )
        ) : null}
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setProgressItemId(null)} open={Boolean(progressItemId)}>
        {selectedPracticeSetProgress ? <PracticeSetProgressDialog progress={selectedPracticeSetProgress} /> : null}
      </Dialog>
    </div>
  );
}

function ContentFormDialog({
  chapters,
  config,
  initialItem,
  isPending,
  module,
  onSubmit,
}: {
  chapters: CourseChapterItemSummary[];
  config: typeof moduleConfig[ModuleKind];
  initialItem?: ContentItem;
  isPending: boolean;
  module: ModuleKind;
  onSubmit: (formData: FormData) => void;
}) {
  const publishAt = initialItem ? getItemPublishAt(initialItem) : null;
  const deadline = initialItem ? getItemDeadline(initialItem) : null;
  const overdue = initialItem ? isOverdueTask(module, initialItem) : false;

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg">
      <DialogTitle>{initialItem ? "Edit item" : config.createLabel}</DialogTitle>
      <DialogDescription>Publishing in the future keeps the item as a draft until its scheduled time.</DialogDescription>
      {overdue ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This task is past its deadline. Review submissions and archive it promptly after review.
        </p>
      ) : null}
      <form action={onSubmit} className="space-y-4">
        <div className={cn("grid gap-4", initialItem ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="content-title">Title</label>
            <Input defaultValue={initialItem?.title ?? ""} id="content-title" name="title" required />
          </div>
          {initialItem ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="content-slug">Slug</label>
              <Input defaultValue={"slug" in initialItem ? (initialItem as { slug?: string }).slug ?? "" : ""} id="content-slug" name="slug" />
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
              Slug will be generated automatically when this item is created.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="content-chapter">Linked chapter</label>
            <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" defaultValue={initialItem?.chapterId ?? ""} id="content-chapter" name="chapter_id">
              <option value="">Class-wide</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {"- ".repeat(chapter.level - 1)}{chapter.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="content-type">{config.typeLabel}</label>
            <select className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" defaultValue={initialItem ? getItemType(module, initialItem) : config.types[0][0]} id="content-type" name="type">
              {config.types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="content-publish">Publish at</label>
            <Input defaultValue={toShanghaiDateTimeInputValue(publishAt)} id="content-publish" name="publish_at" type="datetime-local" />
          </div>
          {module === "tasks" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="content-deadline">Deadline</label>
              <Input defaultValue={toShanghaiDateTimeInputValue(deadline)} id="content-deadline" name="deadline" type="datetime-local" />
            </div>
          ) : null}
        </div>
        {module === "resources" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="content-description">Description</label>
              <Textarea defaultValue={(initialItem as ResourceSummary | undefined)?.description ?? ""} id="content-description" name="description" />
            </div>
            <div className="space-y-3 rounded-lg border border-dashed border-border bg-slate-50 p-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="resource-files">Resource files</label>
                <p className="text-xs text-muted-foreground">Upload one or more files. Each file must be 25 MB or smaller.</p>
              </div>
              <Input id="resource-files" multiple name="resource_files" type="file" />
              {(initialItem as ResourceSummary | undefined)?.files?.length ? (
                <div className="space-y-2 rounded-lg border border-border bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Existing files</p>
                  {(initialItem as ResourceSummary).files!.map((file) => (
                    <div className="flex items-center justify-between gap-3 text-sm" key={file.id}>
                      <span className="min-w-0 truncate">{file.fileName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {module === "tasks" ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="content-body">Instructions</label>
              <Textarea defaultValue={(initialItem as TaskSummary | undefined)?.body ?? ""} id="content-body" name="body" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input className="h-4 w-4 rounded border-slate-300" defaultChecked={(initialItem as TaskSummary | undefined)?.allowResubmission ?? true} name="allow_resubmission" type="checkbox" />
              Allow resubmission
            </label>
          </>
        ) : null}
        {module === "practice-sets" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="content-instructions">Instructions</label>
            <Textarea defaultValue={(initialItem as ExerciseSetSummary | undefined)?.instructions ?? ""} id="content-instructions" name="instructions" />
          </div>
        ) : null}
        <Button disabled={isPending} type="submit">{isPending ? "Saving..." : "Save"}</Button>
      </form>
    </DialogContent>
  );
}

function MetricPie({
  accentClassName,
  detail,
  label,
  metric,
  valueKey,
}: {
  accentClassName: string;
  detail: string;
  label: string;
  metric: PracticeSetProgressMetric;
  valueKey: "completionRate" | "accuracyRate";
}) {
  const value = metric[valueKey];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div aria-label={`${label}: ${value}%`} className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${accentClassName} ${value}%, #e2e8f0 0)` }}>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
          <span className="text-lg font-semibold text-slate-950">{value}%</span>
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-slate-950">{label}</p>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function PracticeSetProgressDashboard({ summary }: { summary: PracticeSetProgressSummary }) {
  const { cumulative, latest, latestSetTitle } = summary.dashboard;

  return (
    <SectionCard
      description={latestSetTitle ? `最新练习集：${latestSetTitle}` : "暂无未归档练习集数据。"}
      title="练习集完成情况仪表盘"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPie
          accentClassName="#2563eb"
          detail={`${cumulative.completedCount}/${cumulative.totalCount} 个学生题目已首次作答`}
          label="累计题目完成率"
          metric={cumulative}
          valueKey="completionRate"
        />
        <MetricPie
          accentClassName="#059669"
          detail={`${cumulative.correctCount}/${cumulative.attemptedCount} 个首次答案正确`}
          label="累计首次正确率"
          metric={cumulative}
          valueKey="accuracyRate"
        />
        <MetricPie
          accentClassName="#7c3aed"
          detail={`${latest.completedCount}/${latest.totalCount} 个学生题目已首次作答`}
          label="最新练习集完成率"
          metric={latest}
          valueKey="completionRate"
        />
        <MetricPie
          accentClassName="#d97706"
          detail={`${latest.correctCount}/${latest.attemptedCount} 个首次答案正确`}
          label="最新练习集首次正确率"
          metric={latest}
          valueKey="accuracyRate"
        />
      </div>
    </SectionCard>
  );
}

function getCompletionStatusLabel(status: PracticeSetProgressSetSummary["students"][number]["completionStatus"]) {
  if (status === "completed") {
    return "已完成";
  }

  if (status === "in_progress") {
    return "未全部完成";
  }

  return "未开始";
}

function PracticeSetProgressDialog({ progress }: { progress: PracticeSetProgressSetSummary }) {
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(() => new Set());

  function toggleStudent(profileId: string) {
    setExpandedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  }

  return (
    <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-lg">
      <DialogTitle>{progress.title} 完成情况</DialogTitle>
      <DialogDescription>
        正确率只统计每个学生每道题的首次作答结果，重做后答对不计入这里的正确率。
      </DialogDescription>

      <div className="mt-5 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-slate-950">每道题正确率</h3>
          </div>
          {progress.itemStats.length > 0 ? (
            <div className="space-y-3">
              {progress.itemStats.map((item, index) => (
                <div className="rounded-lg border border-border bg-white p-3" key={item.itemId}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-950">第 {index + 1} 题</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.prompt}</p>
                    </div>
                    <Badge variant={item.accuracyRate >= 80 ? "success" : item.accuracyRate >= 50 ? "warning" : "muted"}>
                      {item.accuracyRate}% 正确
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.correctCount}/{item.firstAttemptCount} 个首次作答正确
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="这套练习集暂时没有题目。" icon={BarChart3} title="暂无题目数据" />
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-slate-950">学生完成状态</h3>
          {progress.students.length > 0 ? (
            <div className="space-y-3">
              {progress.students.map((student) => {
                const isExpanded = expandedStudentIds.has(student.profileId);

                return (
                  <div className="rounded-lg border border-border bg-white p-4" key={student.profileId}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-950">{student.studentName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {getCompletionStatusLabel(student.completionStatus)} · {student.completedCount}/{student.totalItems} 题已完成
                        </p>
                      </div>
                      <button
                        className="grid h-16 w-16 place-items-center rounded-full border border-primary bg-blue-50 text-sm font-semibold text-primary transition hover:bg-blue-100"
                        onClick={() => toggleStudent(student.profileId)}
                        type="button"
                      >
                        {student.accuracyRate}%
                        <span className="sr-only">展开或折叠学生逐题正误</span>
                      </button>
                    </div>
                    {isExpanded ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {student.items.map((item, index) => (
                          <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={item.itemId}>
                            {item.status === "correct" ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            ) : item.status === "incorrect" ? (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                            ) : (
                              <span className="mt-1 h-3 w-3 shrink-0 rounded-full border border-slate-300" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-700">第 {index + 1} 题：{item.status === "correct" ? "正确" : item.status === "incorrect" ? "错误" : "未作答"}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.prompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState description="这个班级暂时没有可统计的学生。" icon={BarChart3} title="暂无学生数据" />
          )}
        </section>
      </div>
    </DialogContent>
  );
}

function PracticeSetFormDialog({
  chapters,
  classId,
  initialItem,
  isPending,
  onSubmit,
}: {
  chapters: CourseChapterItemSummary[];
  classId: string;
  initialItem?: ExerciseSetDetail;
  isPending: boolean;
  onSubmit: (payload: PracticeSetSubmitPayload) => void;
}) {
  const initialValues = mapExerciseSetDetailToEditorValues(initialItem);
  const form = useForm<ExerciseSetEditorSchema>({
    defaultValues: {
      ...initialValues,
      space_id: classId,
      section_id: "",
      status: initialItem?.status ?? "published",
    },
  });
  const itemsFieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });
  const selectedExerciseType = form.watch("exercise_type");
  const [chapterId, setChapterId] = useState(initialItem?.chapterId ?? "");
  const [publishAt, setPublishAt] = useState(toShanghaiDateTimeInputValue(initialItem?.publishAt));
  const [formError, setFormError] = useState<string | null>(null);

  function changeExerciseType(nextType: ExerciseSetEditorSchema["exercise_type"]) {
    form.setValue("exercise_type", nextType);
    itemsFieldArray.replace([createDefaultExerciseItem(getDefaultExerciseItemType(nextType))]);
  }

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(null);

    if (values.items.length === 0) {
      setFormError("Add at least one exercise item.");
      return;
    }

    const title = values.title.trim();
    onSubmit({
      chapter_id: chapterId || null,
      title,
      slug: initialItem ? values.slug?.trim() || initialItem.slug : undefined,
      instructions: values.instructions?.trim() || null,
      exercise_type: values.exercise_type,
      publish_at: fromShanghaiDateTimeInputValue(publishAt),
      status: values.status,
      items: values.items.map((item, index) => ({
        ...item,
        sort_order: index,
      })),
    });
  });

  return (
    <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-lg">
      <DialogTitle>{initialItem ? "Edit practice set" : "Create practice set"}</DialogTitle>
      <DialogDescription>
        Add or edit the questions students will answer in this class practice set.
      </DialogDescription>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <input type="hidden" {...form.register("space_id")} />
        <input type="hidden" {...form.register("section_id")} />
        <input type="hidden" {...form.register("status")} />
        <div className={cn("grid gap-4", initialItem ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="practice-title">Title</label>
            <Input id="practice-title" required {...form.register("title")} />
          </div>
          {initialItem ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="practice-slug">Slug</label>
              <Input id="practice-slug" {...form.register("slug")} />
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
              Slug will be generated automatically when this practice set is created.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="practice-chapter">Linked chapter</label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
              id="practice-chapter"
              onChange={(event) => setChapterId(event.target.value)}
              value={chapterId}
            >
              <option value="">Class-wide</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {"- ".repeat(chapter.level - 1)}{chapter.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="practice-type">Practice type</label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
              id="practice-type"
              onChange={(event) => changeExerciseType(event.target.value as ExerciseSetEditorSchema["exercise_type"])}
              value={selectedExerciseType}
            >
              <option value="mcq">Multiple choice</option>
              <option value="term_recall">Memorize / term recall</option>
              <option value="flashcard">Flash cards</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="practice-publish">Publish at</label>
            <Input
              id="practice-publish"
              onChange={(event) => setPublishAt(event.target.value)}
              type="datetime-local"
              value={publishAt}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="practice-instructions">Instructions</label>
          <Textarea id="practice-instructions" {...form.register("instructions")} />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Practice questions</h3>
              <p className="text-sm text-muted-foreground">Use the existing MCQ, flash card, and memorize builders.</p>
            </div>
            <Button
              onClick={() => itemsFieldArray.append(createDefaultExerciseItem(getDefaultExerciseItemType(selectedExerciseType)))}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add question
            </Button>
          </div>
          <div className="space-y-4">
            {itemsFieldArray.fields.map((field, index) => (
              <ExerciseItemBuilder
                control={form.control}
                index={index}
                item={form.watch(`items.${index}`) as ExerciseSetEditorSchema["items"][number]}
                key={field.id}
                onRemove={() => itemsFieldArray.remove(index)}
                register={form.register}
              />
            ))}
          </div>
        </div>
        {formError ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
        <Button disabled={isPending} type="submit">{isPending ? "Saving..." : "Save practice set"}</Button>
      </form>
    </DialogContent>
  );
}

function ContentCard({
  config,
  isAdmin,
  isPending,
  item,
  mode,
  module,
  onArchive,
  onDelete,
  onEdit,
  onPublishNow,
  onViewProgress,
}: {
  config: typeof moduleConfig[ModuleKind];
  isAdmin: boolean;
  isPending: boolean;
  item: ContentItem;
  mode: ListMode;
  module: ModuleKind;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPublishNow: () => void;
  onViewProgress?: () => void;
}) {
  const publishAt = getItemPublishAt(item);
  const deadline = getItemDeadline(item);
  const overdue = isOverdueTask(module, item);
  const canDeleteArchived = item.status !== "archived" || module === "tasks" ? isAdmin || item.status !== "archived" : isAdmin;

  return (
    <div className={cn("rounded-lg border bg-white p-4 shadow-sm", overdue ? "border-amber-300 bg-amber-50" : "border-border")}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-950">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.chapterTitle ?? "Class-wide"}</p>
        </div>
        <Badge variant={overdue ? "warning" : item.status === "published" ? "success" : "muted"}>{overdue ? "Overdue" : item.status}</Badge>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>{config.typeLabel}: {getItemType(module, item)}</div>
        <div>Publish: {publishAt ? formatInShanghai(publishAt) : "Immediate"}</div>
        {deadline ? <div>Deadline: {formatInShanghai(deadline)}</div> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={onEdit} size="sm" type="button" variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
        {onViewProgress ? (
          <Button disabled={isPending} onClick={onViewProgress} size="sm" type="button" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            查看完成情况
          </Button>
        ) : null}
        {mode === "drafts" ? (
          <Button disabled={isPending} onClick={onPublishNow} size="sm" type="button" variant="outline">
            <Rocket className="mr-2 h-4 w-4" />
            Publish now
          </Button>
        ) : null}
        <Button disabled={isPending} onClick={onArchive} size="sm" type="button" variant="outline">
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
        {canDeleteArchived ? (
          <Button disabled={isPending} onClick={onDelete} size="sm" type="button" variant="ghost">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
