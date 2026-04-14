import { ArrowRight, BookOpen, Clock3, FilePenLine, GraduationCap, Inbox, MessageSquareWarning } from "lucide-react";

export const teacherMetrics = [
  { labelKey: "dashboard.teacher.metrics.essayOrders.label", value: "12", detailKey: "dashboard.teacher.metrics.essayOrders.detail", icon: FilePenLine },
  { labelKey: "dashboard.teacher.metrics.deadlines.label", value: "7", detailKey: "dashboard.teacher.metrics.deadlines.detail", icon: Clock3 },
  { labelKey: "dashboard.teacher.metrics.classes.label", value: "5", detailKey: "dashboard.teacher.metrics.classes.detail", icon: GraduationCap },
  { labelKey: "dashboard.teacher.metrics.electives.label", value: "4", detailKey: "dashboard.teacher.metrics.electives.detail", icon: BookOpen },
];

export const studentMetrics = [
  { labelKey: "dashboard.student.metrics.classes.label", value: "3", detailKey: "dashboard.student.metrics.classes.detail", icon: GraduationCap },
  { labelKey: "dashboard.student.metrics.notices.label", value: "5", detailKey: "dashboard.student.metrics.notices.detail", icon: Inbox },
  { labelKey: "dashboard.student.metrics.deadlines.label", value: "4", detailKey: "dashboard.student.metrics.deadlines.detail", icon: Clock3 },
  { labelKey: "dashboard.student.metrics.wrongBook.label", value: "9", detailKey: "dashboard.student.metrics.wrongBook.detail", icon: MessageSquareWarning },
];

export const externalMetrics = [
  { labelKey: "dashboard.external.metrics.activeOrders.label", value: "2", detailKey: "dashboard.external.metrics.activeOrders.detail", icon: FilePenLine },
  { labelKey: "dashboard.external.metrics.completedFeedback.label", value: "14", detailKey: "dashboard.external.metrics.completedFeedback.detail", icon: BookOpen },
  { labelKey: "dashboard.external.metrics.nextStep.label", value: "1", detailKey: "dashboard.external.metrics.nextStep.detail", icon: ArrowRight },
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
  {
    titleKey: "notificationsPage.items.workshopUpdated.title",
    detailKey: "notificationsPage.items.workshopUpdated.detail",
    timeKey: "notificationsPage.times.today",
  },
  {
    titleKey: "notificationsPage.items.serviceQueueConfirmed.title",
    detailKey: "notificationsPage.items.serviceQueueConfirmed.detail",
    timeKey: "notificationsPage.times.yesterday",
  },
  {
    titleKey: "notificationsPage.items.electiveFeedbackReleased.title",
    detailKey: "notificationsPage.items.electiveFeedbackReleased.detail",
    timeKey: "notificationsPage.times.apr9",
  },
] as const;
