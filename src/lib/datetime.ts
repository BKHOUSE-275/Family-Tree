export const EASTERN_TZ = "America/New_York";

function easternParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
  };
}

export function formatEasternDateTime(iso: string) {
  const formatted = new Date(iso).toLocaleString("en-US", {
    timeZone: EASTERN_TZ,
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatted} ET`;
}

export function easternDayLabel(iso: string) {
  const that = easternParts(new Date(iso));
  const today = easternParts(new Date());
  const diffDays = Math.round(
    (Date.UTC(today.year, today.month - 1, today.day) -
      Date.UTC(that.year, that.month - 1, that.day)) /
      (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: EASTERN_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: that.year === today.year ? undefined : "numeric",
  });
}
