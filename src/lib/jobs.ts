import type { CollectionEntry } from "astro:content";

type Job = CollectionEntry<"jobs">;

/** One title held at a company, with the dates it was held. */
export type JobRole = Job["data"]["titles"][number];

/**
 * The span a whole entry covers: the earliest role's start through the latest
 * role's end. `current` is true if ANY role is, which is what "still there"
 * means for a company -- a promotion ends one role without ending the tenure.
 *
 * Roles are authored newest first (the schema enforces it), so first and last
 * are the newest and oldest.
 */
export const jobTenure = (
  roles: readonly JobRole[],
): { dateStart: Date; dateEnd?: Date; current: boolean } => {
  const newest = roles[0];
  const oldest = roles[roles.length - 1];
  return {
    dateStart: oldest.dateStart,
    dateEnd: newest.current ? undefined : newest.dateEnd,
    current: newest.current,
  };
};

/**
 * Newest first, by the date the company was joined. `order` is a manual
 * tie-break for two companies joined in the same month, applied after the date
 * sort so it can only ever reorder ties.
 */
export const sortJobs = (jobs: Job[]): Job[] =>
  [...jobs].sort((a, b) => {
    const byDate =
      jobTenure(b.data.titles).dateStart.getTime() - jobTenure(a.data.titles).dateStart.getTime();
    if (byDate !== 0) return byDate;
    return (a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER);
  });

export const currentJobs = (jobs: Job[]): Job[] =>
  sortJobs(jobs).filter((j) => jobTenure(j.data.titles).current);

/** Keep homepage job entries scannable while leaving the full résumé intact. */
export const selectHighlights = (highlights: readonly string[], limit = 2): string[] =>
  highlights.slice(0, Math.max(0, limit));

/** Distinct tech across every role, for the About section's skill list. */
export const collectJobTech = (jobs: Job[]): string[] =>
  [...new Set(jobs.flatMap((j) => j.data.tech))].sort((a, b) => a.localeCompare(b));
