import { APP_TIME_ZONE } from "@/lib/utils/timezone";

export function formatDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatFileSize(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function truncateText(text: string, maxLength = 120) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}
