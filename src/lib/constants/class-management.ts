export const CLASS_MANAGEMENT_MODULES = [
  {
    id: "announcements",
    title: "Class Announcements",
    description: "Manage class notices, schedule reminders, and update messages.",
    hrefSegment: "announcements",
    accentClassName: "bg-blue-50 text-blue-700",
  },
  {
    id: "chapters",
    title: "Course Chapters",
    description: "Organize the class course structure into chapters and sections.",
    hrefSegment: "chapters",
    accentClassName: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "resources",
    title: "Course Resources",
    description: "Manage slides, worksheets, revision files, and learning materials.",
    hrefSegment: "resources",
    accentClassName: "bg-violet-50 text-violet-700",
  },
  {
    id: "tasks",
    title: "Course Tasks",
    description: "Create and monitor assignments, homework, and class tasks.",
    hrefSegment: "tasks",
    accentClassName: "bg-amber-50 text-amber-700",
  },
  {
    id: "practice-sets",
    title: "Course Practice Sets",
    description: "Prepare practice sets for recall, flashcards, and quiz workflows.",
    hrefSegment: "practice-sets",
    accentClassName: "bg-rose-50 text-rose-700",
  },
  {
    id: "student-groups",
    title: "Student Groups",
    description: "Manage student grouping, collaboration rosters, and group visibility.",
    hrefSegment: "student-groups",
    accentClassName: "bg-cyan-50 text-cyan-700",
  },
] as const;

export type ClassManagementModuleId = (typeof CLASS_MANAGEMENT_MODULES)[number]["id"];

export function getClassManagementPath(classId: string) {
  return `/admin/classes/${classId}`;
}

export function getClassManagementModulePath(classId: string, hrefSegment: string) {
  return `${getClassManagementPath(classId)}/${hrefSegment}`;
}

export function getClassManagementModuleBySegment(hrefSegment: string) {
  return CLASS_MANAGEMENT_MODULES.find((module) => module.hrefSegment === hrefSegment) ?? null;
}
