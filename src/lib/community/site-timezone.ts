/** Site calendar boundaries for Mission Hub admin metrics. */
export const SITE_TIMEZONE = "America/Chicago";

type YmdHms = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function readZonedParts(date: Date, timeZone: string): YmdHms {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  let hour = read("hour");
  if (hour === 24) hour = 0;

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
    second: read("second"),
  };
}

/** Convert a wall-clock time in `timeZone` to a UTC Date (iterative; DST-safe). */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  let utcGuess = Date.UTC(year, month - 1, day, hour + 6, minute, second);

  for (let attempt = 0; attempt < 6; attempt++) {
    const local = readZonedParts(new Date(utcGuess), timeZone);
    const targetMinutes =
      hour * 60 + minute + second / 60;
    const localMinutes =
      local.hour * 60 + local.minute + local.second / 60;
    const dayDelta =
      (local.year - year) * 372 +
      (local.month - month) * 31 +
      (local.day - day);
    const diffMinutes = dayDelta * 24 * 60 + (localMinutes - targetMinutes);

    if (Math.abs(diffMinutes) < 0.001) break;
    utcGuess -= diffMinutes * 60_000;
  }

  return new Date(utcGuess);
}

/** Start of the current calendar day in the site timezone. */
export function startOfSiteDay(now = Date.now()): Date {
  const local = readZonedParts(new Date(now), SITE_TIMEZONE);
  return zonedTimeToUtc(
    local.year,
    local.month,
    local.day,
    0,
    0,
    0,
    SITE_TIMEZONE,
  );
}
