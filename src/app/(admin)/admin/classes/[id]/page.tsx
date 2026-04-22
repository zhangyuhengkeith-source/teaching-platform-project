import {
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  Layers3,
  UsersRound,
} from "lucide-react";

import { ClassManagementModuleCard } from "@/components/domain/class-management-module-card";
import { ClassManagementPageHeader } from "@/components/domain/class-management-page-header";
import { CLASS_MANAGEMENT_MODULES, getClassManagementModulePath } from "@/lib/constants/class-management";
import { requireClassManagementContext } from "@/lib/auth/require-class-management";

const moduleIcons = {
  announcements: Bell,
  chapters: Layers3,
  resources: FileText,
  tasks: ClipboardList,
  "practice-sets": BookOpen,
  "student-groups": UsersRound,
} as const;

export default async function ClassManagementHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { classSpace } = await requireClassManagementContext(id);

  return (
    <div className="space-y-6">
      <ClassManagementPageHeader
        classSpace={classSpace}
        description="Choose a module to manage class content, tasks, practice, and student organization."
      />
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {CLASS_MANAGEMENT_MODULES.map((module) => (
          <ClassManagementModuleCard
            accentClassName={module.accentClassName}
            description={module.description}
            href={getClassManagementModulePath(classSpace.id, module.hrefSegment)}
            icon={moduleIcons[module.id]}
            key={module.id}
            title={module.title}
          />
        ))}
      </section>
    </div>
  );
}
