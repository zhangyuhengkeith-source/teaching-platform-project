export const CLASS_SUBJECTS = ["econ", "maths", "phys", "chem", "chinese", "arts"] as const;

export type ClassSubject = (typeof CLASS_SUBJECTS)[number];

export const CLASS_SUBJECT_LABELS: Record<ClassSubject, string> = {
  econ: "经济 Economics",
  maths: "数学 Mathematics",
  phys: "物理 Physics",
  chem: "化学 Chemistry",
  chinese: "语文 Chinese",
  arts: "艺术 Arts",
};

function normalizeSlugFragment(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isClassSubject(value: string): value is ClassSubject {
  return CLASS_SUBJECTS.includes(value as ClassSubject);
}

export function getClassSubjectFromSlug(slug: string | null | undefined): ClassSubject | null {
  const prefix = (slug ?? "").split("-")[0];
  return isClassSubject(prefix) ? prefix : null;
}

export function getClassSubjectLabel(subject: ClassSubject): string {
  return CLASS_SUBJECT_LABELS[subject];
}

export function getClassSubjectLabelFromSlug(slug: string | null | undefined): string {
  const subject = getClassSubjectFromSlug(slug);
  return subject ? getClassSubjectLabel(subject) : (slug ?? "");
}

export function buildClassSlug(subject: ClassSubject, title: string, academicYear?: string | null): string {
  const titlePart = normalizeSlugFragment(title);
  const yearPart = normalizeSlugFragment(academicYear);

  return [subject, titlePart, yearPart].filter(Boolean).join("-");
}
