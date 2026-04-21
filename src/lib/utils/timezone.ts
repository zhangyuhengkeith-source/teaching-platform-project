export const APP_TIME_ZONE = "Asia/Shanghai";

const SHANGHAI_OFFSET_MINUTES = 8 * 60;

function pad(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

export function nowInShanghai() {
  return new Date();
}

export function nowInShanghaiIso() {
  return toShanghaiIsoString(nowInShanghai());
}

export function toShanghaiDate(value: string | number | Date) {
  return new Date(value);
}

export function toShanghaiIsoString(value: string | number | Date) {
  const date = toShanghaiDate(value);
  const shanghaiMs = date.getTime() + SHANGHAI_OFFSET_MINUTES * 60 * 1000;
  const shanghaiDate = new Date(shanghaiMs);

  return [
    shanghaiDate.getUTCFullYear(),
    "-",
    pad(shanghaiDate.getUTCMonth() + 1),
    "-",
    pad(shanghaiDate.getUTCDate()),
    "T",
    pad(shanghaiDate.getUTCHours()),
    ":",
    pad(shanghaiDate.getUTCMinutes()),
    ":",
    pad(shanghaiDate.getUTCSeconds()),
    ".",
    pad(shanghaiDate.getUTCMilliseconds(), 3),
    "+08:00",
  ].join("");
}

export function formatInShanghai(value: string | number | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(toShanghaiDate(value));
}

export function toShanghaiDateTimeInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = toShanghaiDate(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return toShanghaiIsoString(date).slice(0, 16);
}

export function fromShanghaiDateTimeInputValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return `${value.length === 16 ? `${value}:00.000` : value}+08:00`;
}

export function isBeforeShanghaiNow(value: string | number | Date | null | undefined) {
  return Boolean(value && toShanghaiDate(value).getTime() < nowInShanghai().getTime());
}

export function isAfterShanghaiNow(value: string | number | Date | null | undefined) {
  return Boolean(value && toShanghaiDate(value).getTime() > nowInShanghai().getTime());
}
