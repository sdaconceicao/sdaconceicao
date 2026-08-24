import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { collectJobTech, currentJobs, type JobRole, jobTenure, sortJobs } from "./jobs";

type Job = CollectionEntry<"jobs">;

const role = (title: string, dateStart: string, dateEnd?: string): JobRole =>
  ({
    title,
    dateStart: new Date(dateStart),
    dateEnd: dateEnd ? new Date(dateEnd) : undefined,
    current: dateEnd === undefined,
  }) as JobRole;

/** Newest role first, the order the schema enforces on authored entries. */
const job = (id: string, titles: JobRole[], tech: string[] = [], order?: number): Job =>
  ({ id, data: { titles, tech, order } }) as unknown as Job;

/** The common case: one role, so the tenure is that role's own dates. */
const soloJob = (id: string, dateStart: string, dateEnd?: string, tech: string[] = []): Job =>
  job(id, [role("Engineer", dateStart, dateEnd)], tech);

describe("jobTenure", () => {
  it("spans the oldest role's start to the newest role's end", () => {
    const tenure = jobTenure([
      role("Principal Engineer", "2023-01-01", "2025-08-15"),
      role("Senior Engineer", "2020-06-01", "2022-12-31"),
    ]);
    expect(tenure.dateStart).toEqual(new Date("2020-06-01"));
    expect(tenure.dateEnd).toEqual(new Date("2025-08-15"));
    expect(tenure.current).toBe(false);
  });

  it("is a single role's own dates when that is all there is", () => {
    const tenure = jobTenure([role("Engineer", "2020-01-01", "2021-01-01")]);
    expect(tenure.dateStart).toEqual(new Date("2020-01-01"));
    expect(tenure.dateEnd).toEqual(new Date("2021-01-01"));
  });

  // A promotion ends one role without ending the tenure, so an ended older role
  // must not make the company read as left.
  it("is open-ended while the newest role is current", () => {
    const tenure = jobTenure([
      role("Staff Engineer", "2024-01-01"),
      role("Engineer", "2021-01-01"),
    ]);
    expect(tenure.current).toBe(true);
    expect(tenure.dateEnd).toBeUndefined();
    expect(tenure.dateStart).toEqual(new Date("2021-01-01"));
  });
});

describe("sortJobs", () => {
  it("orders by the date the company was joined, newest first", () => {
    const jobs = [soloJob("old", "2015-01-01", "2016-01-01"), soloJob("new", "2022-01-01")];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["new", "old"]);
  });

  // Sorting on the newest ROLE's start would float an old employer above a newer
  // one the moment a promotion landed there.
  it("sorts on the tenure start, not the latest promotion", () => {
    const jobs = [
      job("joined-2019", [role("Lead", "2024-01-01"), role("Engineer", "2019-01-01")]),
      job("joined-2021", [role("Engineer", "2021-01-01", "2023-01-01")]),
    ];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["joined-2021", "joined-2019"]);
  });

  it("uses order as a tie-break when two companies were joined the same month", () => {
    const jobs = [
      job("second", [role("Engineer", "2020-01-01", "2021-01-01")], [], 2),
      job("first", [role("Engineer", "2020-01-01")], [], 1),
    ];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["first", "second"]);
  });

  it("treats a missing order as last among ties", () => {
    const jobs = [
      soloJob("no-order", "2020-01-01", "2021-01-01"),
      job("ordered", [role("Engineer", "2020-01-01", "2021-01-01")], [], 1),
    ];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["ordered", "no-order"]);
  });

  // Same assertion with the inputs reversed, so the nullish coalesce is
  // exercised on BOTH sides of the comparator rather than just one.
  it("treats a missing order as last regardless of input position", () => {
    const jobs = [
      job("ordered", [role("Engineer", "2020-01-01", "2021-01-01")], [], 1),
      soloJob("no-order", "2020-01-01", "2021-01-01"),
    ];
    expect(sortJobs(jobs).map((j) => j.id)).toEqual(["ordered", "no-order"]);
  });

  it("does not mutate its input", () => {
    const jobs = [soloJob("old", "2015-01-01", "2016-01-01"), soloJob("new", "2022-01-01")];
    sortJobs(jobs);
    expect(jobs.map((j) => j.id)).toEqual(["old", "new"]);
  });
});

describe("currentJobs", () => {
  it("keeps only current roles, still sorted", () => {
    const jobs = [
      soloJob("a", "2015-01-01", "2016-01-01"),
      soloJob("b", "2022-01-01"),
      soloJob("c", "2024-01-01"),
    ];
    expect(currentJobs(jobs).map((j) => j.id)).toEqual(["c", "b"]);
  });

  it("counts a company as current when its newest role is", () => {
    const jobs = [job("promoted", [role("Lead", "2024-01-01"), role("Engineer", "2021-01-01")])];
    expect(currentJobs(jobs).map((j) => j.id)).toEqual(["promoted"]);
  });

  it("is empty when nothing is current", () => {
    expect(currentJobs([soloJob("a", "2015-01-01", "2016-01-01")])).toEqual([]);
  });
});

describe("collectJobTech", () => {
  it("de-duplicates and sorts tech across every role", () => {
    const jobs = [
      soloJob("a", "2015-01-01", "2016-01-01", ["React", "CSS"]),
      soloJob("b", "2022-01-01", undefined, ["CSS", "TypeScript"]),
    ];
    expect(collectJobTech(jobs)).toEqual(["CSS", "React", "TypeScript"]);
  });

  it("is empty for no jobs", () => {
    expect(collectJobTech([])).toEqual([]);
  });
});
