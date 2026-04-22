import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ClassManagementModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentClassName?: string;
}

export function ClassManagementModuleCard({
  title,
  description,
  href,
  icon: Icon,
  accentClassName,
}: ClassManagementModuleCardProps) {
  return (
    <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="flex h-full min-h-56 flex-col justify-between gap-6 p-6">
        <div className="space-y-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700", accentClassName)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={href}>
            Manage
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
