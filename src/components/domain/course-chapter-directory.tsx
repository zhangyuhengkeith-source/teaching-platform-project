import { BookOpen, Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { CourseChapterItemSummary, CourseChapterSetSummary } from "@/types/domain";

interface CourseChapterDirectoryProps {
  chapterSets: CourseChapterSetSummary[];
}

const levelClassNames: Record<CourseChapterItemSummary["level"], string> = {
  1: "border-blue-200 bg-blue-50",
  2: "border-emerald-200 bg-emerald-50",
  3: "border-amber-200 bg-amber-50",
  4: "border-slate-200 bg-slate-50",
};

export function CourseChapterDirectory({ chapterSets }: CourseChapterDirectoryProps) {
  return (
    <div className="space-y-5">
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
          {chapterSet.items.length > 0 ? (
            <div className="space-y-2">
              {chapterSet.items
                .slice()
                .sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
                .map((item) => (
                  <div
                    className={cn("rounded-lg border p-3", levelClassNames[item.level])}
                    key={item.id}
                    style={{ marginLeft: `${(item.level - 1) * 20}px` }}
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="muted">L{item.level}</Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-950">{item.title}</p>
                        {item.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              No chapter items have been added yet.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
