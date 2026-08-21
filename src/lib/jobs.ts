import type { CollectionEntry } from "astro:content";

type Job = CollectionEntry<"jobs">;

/**
 * Newest first. `order` is a manual tie-break for roles that started in the
 * same month (a promotion at the same company), applied before the date sort
 * so it can only ever reorder ties.
 */
export const sortJobs = (jobs: Job[]): Job[] =>
  [...jobs].sort((a, b) => {
    const byDate = b.data.dateStart.getTime() - a.data.dateStart.getTime();
    if (byDate !== 0) return byDate;
    return (a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER);
  });

export const currentJobs = (jobs: Job[]): Job[] => sortJobs(jobs).filter((j) => j.data.current);

/** Distinct tech across every role, for the About section's skill list. */
export const collectJobTech = (jobs: Job[]): string[] =>
  [...new Set(jobs.flatMap((j) => j.data.tech))].sort((a, b) => a.localeCompare(b));
