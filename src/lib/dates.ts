/** Formatting helpers for job periods and post dates. All pure, all UTC-stable. */

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Mar 2019". Used in the job date column, which relies on Inter's tnum. */
export const formatMonthYear = (date: Date): string => MONTH_YEAR.format(date);

/** "March 14, 2019". Post bylines. */
export const formatLongDate = (date: Date): string => LONG_DATE.format(date);

/** Machine-readable date for a <time datetime> attribute. */
export const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * "Mar 2019 — Present" / "Mar 2019 — Jun 2021".
 * `current` wins over any dateEnd so a stale end date can't contradict it.
 */
export const formatPeriod = (
  dateStart: Date,
  dateEnd: Date | undefined,
  current: boolean,
): string =>
  `${formatMonthYear(dateStart)} — ${current || !dateEnd ? "Present" : formatMonthYear(dateEnd)}`;

/** Whole years elapsed, floored. Used for the "N+ years" line in About. */
export const yearsSince = (start: Date, now: Date): number => {
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - start.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < start.getUTCDate())) years -= 1;
  return Math.max(0, years);
};

/** ~200 wpm, minimum 1. Word count is whitespace-delimited and good enough. */
export const readingTimeMinutes = (body: string, wordsPerMinute = 200): number => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / wordsPerMinute));
};
