"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  FilePlus2,
  FolderTree,
  Import,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { ClassManagementPageHeader } from "@/components/domain/class-management-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { formatInShanghai } from "@/lib/utils/timezone";
import { cn } from "@/lib/utils/cn";
import type {
  CourseChapterItemSummary,
  CourseChapterLevel,
  CourseChapterSetSummary,
  CourseChapterTemplateSummary,
  SpaceSummary,
} from "@/types/domain";

type DraftChapterItem = {
  id: string;
  parent_id: string | null;
  level: CourseChapterLevel;
  title: string;
  description: string | null;
  sort_order: number;
};

type DraftChapterSet = {
  id: string;
  main_title: string;
  subtitle: string;
  items: DraftChapterItem[];
};

interface CourseChaptersManagerProps {
  classSpace: SpaceSummary;
  currentUserId: string;
  isAdmin: boolean;
  initialChapterSets: CourseChapterSetSummary[];
  initialTemplates: CourseChapterTemplateSummary[];
}

const levelStyles = {
  1: "border-blue-200 bg-blue-50 text-blue-800",
  2: "border-emerald-200 bg-emerald-50 text-emerald-800",
  3: "border-amber-200 bg-amber-50 text-amber-800",
  4: "border-slate-200 bg-slate-50 text-slate-700",
} satisfies Record<CourseChapterLevel, string>;

function toDraftChapterSet(chapterSet: CourseChapterSetSummary): DraftChapterSet {
  return {
    id: chapterSet.id,
    main_title: chapterSet.mainTitle,
    subtitle: chapterSet.subtitle ?? "",
    items: chapterSet.items.map((item) => ({
      id: item.id,
      parent_id: item.parentId,
      level: item.level,
      title: item.title,
      description: item.description,
      sort_order: item.sortOrder,
    })),
  };
}

function normalizeDraftItems(items: DraftChapterItem[]) {
  const byParent = new Map<string, DraftChapterItem[]>();

  for (const item of items) {
    const key = item.parent_id ?? "root";
    const siblings = byParent.get(key) ?? [];
    siblings.push(item);
    byParent.set(key, siblings);
  }

  return items.map((item) => {
    const siblings = (byParent.get(item.parent_id ?? "root") ?? []).sort((a, b) => a.sort_order - b.sort_order);
    return {
      ...item,
      sort_order: siblings.findIndex((sibling) => sibling.id === item.id),
    };
  });
}

function sortTreeItems(a: DraftChapterItem, b: DraftChapterItem) {
  return a.sort_order - b.sort_order || a.title.localeCompare(b.title);
}

function getDescendantIds(items: DraftChapterItem[], itemId: string) {
  const descendants = new Set<string>();
  const visit = (parentId: string) => {
    for (const item of items) {
      if (item.parent_id === parentId) {
        descendants.add(item.id);
        visit(item.id);
      }
    }
  };

  visit(itemId);
  return descendants;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export function CourseChaptersManager({
  classSpace,
  currentUserId,
  isAdmin,
  initialChapterSets,
  initialTemplates,
}: CourseChaptersManagerProps) {
  const [chapterSets, setChapterSets] = useState(initialChapterSets);
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedSetId, setSelectedSetId] = useState(initialChapterSets[0]?.id ?? "");
  const [draft, setDraft] = useState<DraftChapterSet | null>(initialChapterSets[0] ? toDraftChapterSet(initialChapterSets[0]) : null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = useMemo(
    () => chapterSets.find((chapterSet) => chapterSet.id === selectedSetId) ?? null,
    [chapterSets, selectedSetId],
  );

  useEffect(() => {
    setDraft(selectedSet ? toDraftChapterSet(selectedSet) : null);
  }, [selectedSet]);

  const apiBase = `/api/admin/classes/${classSpace.id}`;

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

  function replaceChapterSet(next: CourseChapterSetSummary) {
    setChapterSets((current) => {
      const withoutCurrent = current.filter((chapterSet) => chapterSet.id !== next.id);
      return [next, ...withoutCurrent];
    });
    setSelectedSetId(next.id);
  }

  async function createChapterSet(formData: FormData) {
    const mainTitle = String(formData.get("main_title") ?? "").trim();
    const subtitle = String(formData.get("subtitle") ?? "").trim();

    const response = await fetch(`${apiBase}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_title: mainTitle,
        subtitle: subtitle || null,
        status: "published",
        items: [],
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const body = (await response.json()) as { item: CourseChapterSetSummary };
    replaceChapterSet(body.item);
    setMessage("Chapter outline created.");
  }

  async function saveDraft() {
    if (!draft) {
      return;
    }

    const response = await fetch(`${apiBase}/chapters/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_title: draft.main_title,
        subtitle: draft.subtitle || null,
        items: normalizeDraftItems(draft.items),
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const body = (await response.json()) as { item: CourseChapterSetSummary };
    replaceChapterSet(body.item);
    setMessage("Chapter outline saved.");
  }

  async function deleteSelectedChapterSet() {
    if (!selectedSet) {
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedSet.mainTitle}"? Students will be notified once.`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`${apiBase}/chapters/${selectedSet.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    setChapterSets((current) => current.filter((chapterSet) => chapterSet.id !== selectedSet.id));
    setSelectedSetId("");
    setDraft(null);
    setMessage("Chapter outline deleted.");
  }

  async function saveTemplate(formData: FormData) {
    if (!selectedSet) {
      return;
    }

    const response = await fetch(`${apiBase}/chapter-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapter_set_id: selectedSet.id,
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        visibility: formData.get("share") === "on" ? "teachers" : "private",
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const body = (await response.json()) as { item: CourseChapterTemplateSummary };
    setTemplates((current) => [body.item, ...current.filter((template) => template.id !== body.item.id)]);
    setMessage("Template saved.");
  }

  async function importTemplate(formData: FormData) {
    const templateId = String(formData.get("template_id") ?? "");
    const template = templates.find((item) => item.id === templateId);

    const response = await fetch(`${apiBase}/chapter-templates/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: templateId,
        main_title: String(formData.get("main_title") ?? "").trim() || template?.mainTitle,
        subtitle: String(formData.get("subtitle") ?? "").trim() || template?.subtitle,
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const body = (await response.json()) as { item: CourseChapterSetSummary };
    replaceChapterSet(body.item);
    setMessage("Template imported into this class.");
  }

  async function deleteTemplate(templateId: string) {
    const response = await fetch(`${apiBase}/chapter-templates/${templateId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    setTemplates((current) => current.filter((template) => template.id !== templateId));
    setMessage("Template deleted.");
  }

  function updateDraftItem(itemId: string, patch: Partial<DraftChapterItem>) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      };
    });
  }

  function addChapterItem(parent?: DraftChapterItem) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const level = parent ? ((parent.level + 1) as CourseChapterLevel) : 1;
      const siblingCount = current.items.filter((item) => item.parent_id === (parent?.id ?? null)).length;
      const nextItem: DraftChapterItem = {
        id: crypto.randomUUID(),
        parent_id: parent?.id ?? null,
        level,
        title: "",
        description: null,
        sort_order: siblingCount,
      };

      return {
        ...current,
        items: [...current.items, nextItem],
      };
    });
  }

  function deleteChapterItem(itemId: string) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const descendants = getDescendantIds(current.items, itemId);
      return {
        ...current,
        items: normalizeDraftItems(current.items.filter((item) => item.id !== itemId && !descendants.has(item.id))),
      };
    });
  }

  function moveChapterItem(itemId: string, direction: "up" | "down") {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const target = current.items.find((item) => item.id === itemId);
      if (!target) {
        return current;
      }

      const siblings = current.items
        .filter((item) => item.parent_id === target.parent_id)
        .sort(sortTreeItems);
      const index = siblings.findIndex((item) => item.id === itemId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;

      if (swapIndex < 0 || swapIndex >= siblings.length) {
        return current;
      }

      const first = siblings[index];
      const second = siblings[swapIndex];

      return {
        ...current,
        items: current.items.map((item) => {
          if (item.id === first.id) {
            return { ...item, sort_order: second.sort_order };
          }
          if (item.id === second.id) {
            return { ...item, sort_order: first.sort_order };
          }
          return item;
        }),
      };
    });
  }

  function renderTree(parentId: string | null, depth = 0): ReactNode {
    if (!draft) {
      return null;
    }

    const items = draft.items.filter((item) => item.parent_id === parentId).sort(sortTreeItems);

    return items.map((item, index) => {
      const siblings = draft.items.filter((candidate) => candidate.parent_id === parentId);
      const hasChildren = draft.items.some((candidate) => candidate.parent_id === item.id);

      return (
        <div className="space-y-2" key={item.id}>
          <div
            className={cn(
              "grid gap-3 rounded-lg border p-3",
              levelStyles[item.level],
            )}
            style={{ marginLeft: `${depth * 24}px` }}
          >
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[76px_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
              <Badge variant="muted">Level {item.level}</Badge>
              <Input
                disabled={isPending}
                onChange={(event) => updateDraftItem(item.id, { title: event.target.value })}
                placeholder="Chapter title"
                value={item.title}
              />
              <Input
                disabled={isPending}
                onChange={(event) => updateDraftItem(item.id, { description: event.target.value })}
                placeholder="Optional description"
                value={item.description ?? ""}
              />
              <div className="flex flex-wrap gap-1">
                <Button
                  disabled={isPending || index === 0}
                  onClick={() => moveChapterItem(item.id, "up")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Move up</span>
                </Button>
                <Button
                  disabled={isPending || index === siblings.length - 1}
                  onClick={() => moveChapterItem(item.id, "down")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Move down</span>
                </Button>
                {item.level < 4 ? (
                  <Button disabled={isPending} onClick={() => addChapterItem(item)} size="sm" type="button" variant="outline">
                    <Plus className="mr-1 h-4 w-4" />
                    Child
                  </Button>
                ) : null}
                <Button disabled={isPending} onClick={() => deleteChapterItem(item.id)} size="sm" type="button" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete chapter item</span>
                </Button>
              </div>
            </div>
            {hasChildren ? <div className="text-xs font-medium opacity-70">Contains nested chapters</div> : null}
          </div>
          {renderTree(item.id, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="space-y-6">
      <ClassManagementPageHeader
        classSpace={classSpace}
        description="Create and maintain a four-level course chapter directory for this class."
        showBackToModules
        title="Course Chapters"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-950">Chapter directory</h2>
          <p className="text-sm text-muted-foreground">Class-bound outlines and reusable templates. No class selector is needed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button">
                <FilePlus2 className="mr-2 h-4 w-4" />
                New outline
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg">
              <DialogTitle>Create chapter outline</DialogTitle>
              <DialogDescription>Main title and subtitle are unique inside this class only.</DialogDescription>
              <form action={(formData) => runOperation(() => createChapterSet(formData))} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="new-main-title">Course main title</label>
                  <Input id="new-main-title" name="main_title" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="new-subtitle">Course subtitle</label>
                  <Input id="new-subtitle" name="subtitle" />
                </div>
                <Button disabled={isPending} type="submit">
                  {isPending ? "Creating..." : "Create outline"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Import className="mr-2 h-4 w-4" />
                Import template
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg">
              <DialogTitle>Import chapter template</DialogTitle>
              <DialogDescription>Templates import into the current class and keep the original hierarchy.</DialogDescription>
              {templates.length === 0 ? (
                <EmptyState
                  description="No saved chapter templates are available yet."
                  icon={FolderTree}
                  title="No templates"
                />
              ) : (
                <form action={(formData) => runOperation(() => importTemplate(formData))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="template-id">Template</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
                      id="template-id"
                      name="template_id"
                      required
                    >
                      <option value="">Select template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.visibility})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="import-main-title">Main title override</label>
                      <Input id="import-main-title" name="main_title" placeholder="Use template title" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="import-subtitle">Subtitle override</label>
                      <Input id="import-subtitle" name="subtitle" placeholder="Use template subtitle" />
                    </div>
                  </div>
                  <Button disabled={isPending} type="submit">
                    {isPending ? "Importing..." : "Import into class"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard description="Select an outline to edit its tree." title="Outlines">
          {chapterSets.length === 0 ? (
            <EmptyState
              action={
                <Button onClick={() => addChapterItem()} type="button" variant="outline" disabled>
                  Create an outline first
                </Button>
              }
              description="Create a chapter outline or import a template to begin."
              icon={BookOpen}
              title="No chapter outlines"
            />
          ) : (
            <div className="space-y-2">
              {chapterSets.map((chapterSet) => (
                <button
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition hover:border-primary hover:bg-slate-50",
                    chapterSet.id === selectedSetId ? "border-primary bg-blue-50" : "border-border bg-white",
                  )}
                  key={chapterSet.id}
                  onClick={() => setSelectedSetId(chapterSet.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-950">{chapterSet.mainTitle}</div>
                      {chapterSet.subtitle ? <div className="text-sm text-muted-foreground">{chapterSet.subtitle}</div> : null}
                    </div>
                    {chapterSet.status === "archived" ? <Badge variant="warning">Archived</Badge> : null}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {chapterSet.items.length} item{chapterSet.items.length === 1 ? "" : "s"} · Updated{" "}
                    {formatInShanghai(chapterSet.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            action={
              selectedSet ? (
                <div className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button disabled={!selectedSet || isPending} type="button" variant="outline">
                        <Save className="mr-2 h-4 w-4" />
                        Save as template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-lg">
                      <DialogTitle>Save reusable template</DialogTitle>
                      <DialogDescription>Templates can stay private or be shared with other teachers.</DialogDescription>
                      <form action={(formData) => runOperation(() => saveTemplate(formData))} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="template-name">Template name</label>
                          <Input defaultValue={selectedSet.mainTitle} id="template-name" name="name" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="template-description">Description</label>
                          <Textarea id="template-description" name="description" />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input className="h-4 w-4 rounded border-slate-300" defaultChecked name="share" type="checkbox" />
                          Share with teachers
                        </label>
                        <Button disabled={isPending} type="submit">
                          {isPending ? "Saving..." : "Save template"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button disabled={isPending} onClick={() => runOperation(deleteSelectedChapterSet)} type="button" variant="outline">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ) : null
            }
            description="Edit the course title, subtitle, and up to four levels of chapter items."
            title="Tree editor"
          >
            {!draft ? (
              <EmptyState
                description="Select or create an outline before editing chapter items."
                icon={FolderTree}
                title="Nothing selected"
              />
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="main-title">Course main title</label>
                    <Input
                      disabled={isPending}
                      id="main-title"
                      onChange={(event) => setDraft((current) => current ? { ...current, main_title: event.target.value } : current)}
                      value={draft.main_title}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="subtitle">Course subtitle</label>
                    <Input
                      disabled={isPending}
                      id="subtitle"
                      onChange={(event) => setDraft((current) => current ? { ...current, subtitle: event.target.value } : current)}
                      value={draft.subtitle}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button disabled={isPending} onClick={() => addChapterItem()} type="button" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add level 1
                  </Button>
                  <Button disabled={isPending} onClick={() => runOperation(saveDraft)} type="button">
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>

                {draft.items.length === 0 ? (
                  <EmptyState
                    action={
                      <Button disabled={isPending} onClick={() => addChapterItem()} type="button">
                        <Plus className="mr-2 h-4 w-4" />
                        Add first chapter
                      </Button>
                    }
                    description="Add level 1 chapters, then nest child chapters down to level 4."
                    icon={FolderTree}
                    title="No chapter items"
                  />
                ) : (
                  <div className="space-y-3">{renderTree(null)}</div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard description="Saved chapter structures available for future classes." title="Templates">
            {templates.length === 0 ? (
              <EmptyState
                description="Save a completed chapter outline as a template to reuse it later."
                icon={FolderTree}
                title="No templates yet"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {templates.map((template) => {
                  const canDeleteTemplate = isAdmin || template.createdBy === currentUserId;

                  return (
                    <div className="rounded-lg border border-border bg-white p-4" key={template.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-slate-950">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.mainTitle}</p>
                        </div>
                        <Badge variant={template.visibility === "teachers" ? "primary" : "muted"}>
                          {template.visibility === "teachers" ? "Teachers" : "Private"}
                        </Badge>
                      </div>
                      {template.description ? <p className="mt-2 text-sm text-slate-600">{template.description}</p> : null}
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{template.items.length} item{template.items.length === 1 ? "" : "s"}</span>
                        {canDeleteTemplate ? (
                          <Button
                            disabled={isPending}
                            onClick={() => runOperation(() => deleteTemplate(template.id))}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete template</span>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
