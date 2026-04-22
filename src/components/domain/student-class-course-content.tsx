"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Download, FileStack, Layers3, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime, formatFileSize, truncateText } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ResourceType } from "@/lib/constants/resource-types";
import type { CourseChapterItemSummary, CourseChapterSetSummary, ResourceSummary } from "@/types/domain";

interface StudentClassCourseContentProps {
  chapterSets: CourseChapterSetSummary[];
  resources: ResourceSummary[];
}

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  ppt: "PPT",
  case_analysis: "案例分析",
  revision: "复习资料",
  extension: "拓展资料",
  worksheet: "练习单",
  model_answer: "参考答案",
  mock_paper: "模拟试卷",
  mark_scheme: "评分标准",
  other: "其他",
};

const levelClassNames: Record<CourseChapterItemSummary["level"], string> = {
  1: "border-blue-200 bg-blue-50",
  2: "border-emerald-200 bg-emerald-50",
  3: "border-amber-200 bg-amber-50",
  4: "border-slate-200 bg-slate-50",
};

function sortChapterItems(a: CourseChapterItemSummary, b: CourseChapterItemSummary) {
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
}

function getDescendantIds(items: CourseChapterItemSummary[], itemId: string) {
  const ids = new Set<string>([itemId]);
  const visit = (parentId: string) => {
    for (const item of items) {
      if (item.parentId === parentId) {
        ids.add(item.id);
        visit(item.id);
      }
    }
  };

  visit(itemId);
  return ids;
}

function getAncestorIds(items: CourseChapterItemSummary[], itemId: string | null | undefined) {
  const ids: string[] = [];
  let current = itemId ? items.find((item) => item.id === itemId) ?? null : null;

  while (current?.parentId) {
    ids.push(current.parentId);
    current = items.find((item) => item.id === current?.parentId) ?? null;
  }

  return ids;
}

function resourceSortValue(resource: ResourceSummary) {
  return resource.updatedAt ?? resource.publishAt ?? resource.publishedAt ?? resource.createdAt ?? "";
}

export function StudentClassCourseContent({ chapterSets, resources }: StudentClassCourseContentProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isResourceListOpen, setIsResourceListOpen] = useState(false);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | "all">("all");
  const [highlightedChapterId, setHighlightedChapterId] = useState<string | null>(null);

  const allItems = useMemo(() => chapterSets.flatMap((chapterSet) => chapterSet.items), [chapterSets]);
  const chapterById = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);
  const resourcesByChapterTree = useMemo(() => {
    const map = new Map<string, ResourceSummary[]>();

    for (const item of allItems) {
      const subtreeIds = getDescendantIds(allItems, item.id);
      map.set(
        item.id,
        resources
          .filter((resource) => Boolean(resource.chapterId && subtreeIds.has(resource.chapterId)))
          .sort((a, b) => resourceSortValue(b).localeCompare(resourceSortValue(a))),
      );
    }

    return map;
  }, [allItems, resources]);
  const latestResource = useMemo(
    () => resources.slice().sort((a, b) => resourceSortValue(b).localeCompare(resourceSortValue(a)))[0] ?? null,
    [resources],
  );
  const filteredResources = useMemo(
    () =>
      resources
        .filter((resource) => resourceTypeFilter === "all" || resource.resourceType === resourceTypeFilter)
        .sort((a, b) => resourceSortValue(b).localeCompare(resourceSortValue(a))),
    [resourceTypeFilter, resources],
  );
  const secondLevelCount = allItems.filter((item) => item.level === 2).length;
  const selectedChapter = selectedChapterId ? chapterById.get(selectedChapterId) ?? null : null;
  const selectedChapterResources = selectedChapterId ? resourcesByChapterTree.get(selectedChapterId) ?? [] : [];
  const getResourceChapterTitle = (resource: ResourceSummary) => resource.chapterTitle ?? (resource.chapterId ? chapterById.get(resource.chapterId)?.title ?? null : null);

  function toggleExpanded(itemId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function focusChapter(chapterId: string | null | undefined) {
    if (!chapterId) {
      setIsResourceListOpen(false);
      return;
    }

    const ancestorIds = getAncestorIds(allItems, chapterId);
    setExpandedIds((current) => new Set([...current, ...ancestorIds]));
    setHighlightedChapterId(chapterId);
    setIsResourceListOpen(false);

    window.setTimeout(() => {
      document.getElementById(`chapter-${chapterId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function openChapterResources(itemId: string) {
    setSelectedChapterId(itemId);
  }

  function renderChapterTree(chapterSet: CourseChapterSetSummary, parentId: string | null, depth = 0) {
    const items = chapterSet.items.filter((item) => item.parentId === parentId).sort(sortChapterItems);

    return items.map((item) => {
      const children = chapterSet.items.filter((child) => child.parentId === item.id).sort(sortChapterItems);
      const isExpanded = expandedIds.has(item.id);
      const resourceCount = resourcesByChapterTree.get(item.id)?.length ?? 0;
      const isHighlighted = highlightedChapterId === item.id;

      return (
        <div className="space-y-2" key={item.id}>
          <div
            className={cn(
              "rounded-lg border p-3 transition",
              levelClassNames[item.level],
              isHighlighted ? "ring-2 ring-primary ring-offset-2" : "",
            )}
            id={`chapter-${item.id}`}
            style={{ marginLeft: `${depth * 20}px` }}
          >
            <div className="flex items-start gap-3">
              <Button
                className="mt-0.5 h-7 w-7 shrink-0 px-0"
                disabled={children.length === 0}
                onClick={() => toggleExpanded(item.id)}
                type="button"
                variant="ghost"
              >
                {children.length > 0 ? (
                  isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                ) : (
                  <span className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle chapter</span>
              </Button>
              <button className="min-w-0 flex-1 text-left" onClick={() => openChapterResources(item.id)} type="button">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{item.level}级标题</Badge>
                  <span className="font-medium text-slate-950">{item.title}</span>
                  <Badge variant={resourceCount > 0 ? "primary" : "muted"}>{resourceCount} 个资源</Badge>
                </div>
                {item.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                {isHighlighted ? (
                  <p className="mt-2 text-xs font-medium text-primary">已定位到该资源关联的章节标题，点击标题可查看并下载资源。</p>
                ) : null}
              </button>
            </div>
          </div>
          {isExpanded ? renderChapterTree(chapterSet, item.id, depth + 1) : null}
        </div>
      );
    });
  }

  return (
    <>
      <SectionCard description="默认仅展示一级标题。展开标题可查看下级目录，点击任一级标题可查看该标题及其下属标题关联的资源下载。" title="课程章节">
        {chapterSets.length > 0 ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              章节总数仅统计二级标题数量：<span className="font-semibold">{secondLevelCount}</span>
            </div>
            {chapterSets.map((chapterSet) => (
              <div className="space-y-3 rounded-xl border border-border bg-white p-4" key={chapterSet.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{chapterSet.mainTitle}</h3>
                    {chapterSet.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{chapterSet.subtitle}</p> : null}
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2">{renderChapterTree(chapterSet, null)}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState description="教师暂未发布这个班级的课程章节目录。" icon={Layers3} title="暂无课程章节" />
        )}
      </SectionCard>

      <SectionCard description="此卡片仅展示最新上传的课程资源介绍。下载资源请进入该资源关联的课程章节标题。" title="课程资源">
        {latestResource ? (
          <button className="block w-full text-left" onClick={() => setIsResourceListOpen(true)} type="button">
            <Card className="transition hover:border-blue-200 hover:shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{latestResource.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{RESOURCE_TYPE_LABELS[latestResource.resourceType]}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-primary">
                    <FileStack className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  {truncateText(latestResource.description ?? "最新上传的课程资源已合并到对应课程章节中。", 180)}
                </p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  课程资源按关联章节归档。点击此卡片可查看全部资源列表，选择资源后会跳转到对应章节标题，再从章节弹窗中下载。
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge variant="muted">{getResourceChapterTitle(latestResource) ?? "未关联章节"}</Badge>
                  {resourceSortValue(latestResource) ? <span>更新于 {formatDateTime(resourceSortValue(latestResource))}</span> : null}
                </div>
              </CardContent>
            </Card>
          </button>
        ) : (
          <EmptyState description="教师暂未为这个班级上传课程资源。" icon={BookOpen} title="暂无资源" />
        )}
      </SectionCard>

      <Dialog open={Boolean(selectedChapterId)} onOpenChange={(open) => !open && setSelectedChapterId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-lg">
          <DialogTitle>{selectedChapter?.title ?? "章节资源"}</DialogTitle>
          <DialogDescription>
            这里展示该标题及其下属标题关联的资源，可在弹窗中下载文件。
          </DialogDescription>
          {selectedChapterResources.length > 0 ? (
            <div className="mt-5 space-y-4">
              {selectedChapterResources.map((resource) => (
                <div className="rounded-xl border border-border bg-white p-4" key={resource.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{resource.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{RESOURCE_TYPE_LABELS[resource.resourceType]}</p>
                    </div>
                    <Badge variant="muted">{getResourceChapterTitle(resource) ?? "未关联章节"}</Badge>
                  </div>
                  {resource.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{resource.description}</p> : null}
                  {resource.files?.length ? (
                    <div className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      {resource.files.map((file) => (
                        <a
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-white hover:text-primary"
                          href={`/api/resources/${resource.id}/files/${file.id}`}
                          key={file.id}
                        >
                          <span className="min-w-0 truncate">{file.fileName}</span>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                            {formatFileSize(file.fileSize) ? <span>{formatFileSize(file.fileSize)}</span> : null}
                            <Download className="h-4 w-4" />
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted-foreground">此资源暂未上传附件。</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="该标题及其下属标题暂未关联课程资源。" icon={FileStack} title="暂无关联资源" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isResourceListOpen} onOpenChange={setIsResourceListOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-lg">
          <DialogTitle>全部课程资源</DialogTitle>
          <DialogDescription>
            可按资源类型筛选。选择某个资源后会自动定位到它关联的章节标题。
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setResourceTypeFilter("all")} size="sm" type="button" variant={resourceTypeFilter === "all" ? "default" : "outline"}>
                全部
              </Button>
              {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map((type) => (
                <Button key={type} onClick={() => setResourceTypeFilter(type)} size="sm" type="button" variant={resourceTypeFilter === type ? "default" : "outline"}>
                  {RESOURCE_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
            {filteredResources.length > 0 ? (
              <div className="space-y-2">
                {filteredResources.map((resource) => (
                  <button
                    className="flex w-full items-start justify-between gap-4 rounded-lg border border-border bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                    key={resource.id}
                    onClick={() => focusChapter(resource.chapterId)}
                    type="button"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-950">{resource.title}</span>
                        <Badge variant="muted">{RESOURCE_TYPE_LABELS[resource.resourceType]}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{getResourceChapterTitle(resource) ?? "未关联章节"}</p>
                    </div>
                    <Search className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState description="当前筛选条件下没有课程资源。" icon={FileStack} title="暂无资源" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
