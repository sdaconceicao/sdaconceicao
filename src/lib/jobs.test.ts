import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { collectJobTech, currentJobs, sortJobs } from "./jobs";

type Job = CollectionEntry<"jobs">;

const job = (
  id: string,
  dateStart: string,
  current: boolean,
  tech: string[] = [],
  order?: number,
): Job =>
  ({ id, data: { dateStart: new Date(dateStart), current, tech, order } }) as unknown as Job;

describe("sortJobs", () => {
  it("orders by start date, newest first", () => {
    const jobs = [job("old", "2015-01-01", false), job("new", "2022-01-01", true)];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["new", "old"]);
  });

  // Two roles at the same company starting the same month -- a promotion.
  it("uses order as a tie-break when start dates are identical", () => {
    const jobs = [
      job("junior", "2020-01-01", false, [], 2),
      job("senior", "2020-01-01", true, [], 1),
    ];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["senior", "junior"]);
  });

  it("treats a missing order as last among ties", () => {
    const jobs = [job("no-order", "2020-01-01", false), job("ordered", "2020-01-01", false, [], 1)];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["ordered", "no-order"]);
  });

  // Same assertion with the inputs reversed, so the nullish coalesce is
  // exercised on BOTH sides of the comparator rather than just one.
  it("treats a missing order as last regardless of input position", () => {
    const jobs = [job("ordered", "2020-01-01", false, [], 1), job("no-order", "2020-01-01", false)];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["ordered", "no-order"]);
  });

  it("does not mutate its input", () => {
    const jobs = [job("old", "2015-01-01", false), job("new", "2022-01-01", true)];
    sortJobs(jobs);
    expect(jobs.map((j) => j.id)).toEqual(["old", "new"]);
  });
});

describe("currentJobs", () => {
  it("keeps only current roles, still sorted", () => {
    const jobs = [
      job("a", "2015-01-01", false),
      job("b", "2022-01-01", true),
      job("c", "2024-01-01", true),
    ];
    expect(currentJobs(jobs).map((j) => j.id)).toEqual(["c", "b"]);
  });

  it("is empty when nothing is current", () => {
    expect(currentJobs([job("a", "2015-01-01", false)])).toEqual([]);
  });
});

describe("collectJobTech", () => {
  it("de-duplicates and sorts tech across every role", () => {
    const jobs = [
      job("a", "2015-01-01", false, ["React", "CSS"]),
      job("b", "2022-01-01", true, ["CSS", "TypeScript"]),
    ];
    expect(collectJobTech(jobs)).toEqual(["CSS", "React", "TypeScript"]);
  });

  it("is empty for no jobs", () => {
    expect(collectJobTech([])).toEqual([]);
  });
});
