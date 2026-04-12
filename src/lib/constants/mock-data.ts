import { ArrowRight, BookOpen, Clock3, FilePenLine, GraduationCap, Inbox, MessageSquareWarning } from "lucide-react";

export const teacherMetrics = [
  { label: "Pending essay orders", value: "12", detail: "4 need feedback today", icon: FilePenLine },
  { label: "Upcoming deadlines", value: "7", detail: "Across 3 active cohorts", icon: Clock3 },
  { label: "Active classes", value: "5", detail: "Including 2 intensive groups", icon: GraduationCap },
  { label: "Elective groups", value: "4", detail: "Spring term pathways", icon: BookOpen },
];

export const studentMetrics = [
  { label: "My classes", value: "3", detail: "This week’s active schedule", icon: GraduationCap },
  { label: "Latest notices", value: "5", detail: "2 require response", icon: Inbox },
  { label: "Upcoming deadlines", value: "4", detail: "Essay and reading tasks", icon: Clock3 },
  { label: "Wrong-book items", value: "9", detail: "Ready for revision", icon: MessageSquareWarning },
];

export const externalMetrics = [
  { label: "Active orders", value: "2", detail: "One in review, one in queue", icon: FilePenLine },
  { label: "Completed feedback", value: "14", detail: "Recent reports available", icon: BookOpen },
  { label: "Next recommended step", value: "1", detail: "Prepare your revised draft", icon: ArrowRight },
];

export const classesMock = [
  { title: "Advanced Composition", subtitle: "Tuesday and Thursday", status: "active" as const },
  { title: "Reading Seminar", subtitle: "Small-group discussion", status: "published" as const },
];

export const electivesMock = [
  { title: "Debate Studio", subtitle: "Applications open for May", status: "active" as const },
  { title: "Literary Close Reading", subtitle: "Waiting list available", status: "pending" as const },
];

export const notificationsMock = [
  { title: "Term writing workshop updated", detail: "Materials for Week 3 are now available.", time: "Today" },
  { title: "Essay service queue confirmed", detail: "Your next submission window opens on Monday.", time: "Yesterday" },
  { title: "Elective feedback released", detail: "Annotated notes were added to your portfolio.", time: "Apr 9" },
];

