import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChapterCardProps {
  title: string;
  description?: string | null;
  type: string;
  resourceCount?: number;
  href: string;
}

export function ChapterCard({ title, description, type, resourceCount, href }: ChapterCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-2 text-sm capitalize text-muted-foreground">{type.replace("_", " ")}</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <Layers3 className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{description ?? "Section overview will appear here as the teaching flow expands."}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{resourceCount ?? 0} resources</span>
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary" href={href}>
            Open section
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

