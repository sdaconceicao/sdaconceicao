import { describe, expect, it } from "vitest";
import { matchesProject, projectResultCount, projectTags } from "./ProjectBrowser";

const project = { title: "Poképendium", tech: ["TypeScript", "Next.js"], status: "live" };

describe("project filters", () => {
  it("derives a sorted, unique tag list without changing projects", () => {
    const projects = [project, { title: "Lago", tech: ["TypeScript", "React"] }];
    expect(projectTags(projects)).toEqual(["Next.js", "React", "TypeScript"]);
    expect(project.tech).toEqual(["TypeScript", "Next.js"]);
    expect(projectTags([])).toEqual([]);
  });

  it("matches partial names regardless of case, accents, or surrounding spaces", () => {
    expect(matchesProject(project, "  POKEPEN  ", [])).toBe(true);
    expect(matchesProject(project, "Poké", [])).toBe(true);
    expect(matchesProject(project, "   ", [])).toBe(true);
    expect(matchesProject(project, "Lago", [])).toBe(false);
  });

  it("matches any selected tag and requires the name to match too", () => {
    expect(matchesProject(project, "", ["React", "Next.js"])).toBe(true);
    expect(matchesProject(project, "poke", ["TypeScript"])).toBe(true);
    expect(matchesProject(project, "Lago", ["TypeScript"])).toBe(false);
    expect(matchesProject(project, "poke", ["React"])).toBe(false);
    expect(matchesProject(project, "", ["Next"])).toBe(false);
    expect(matchesProject({ title: "Empty", tech: [], status: "live" }, "", ["React"])).toBe(false);
    expect(matchesProject({ title: "Empty", tech: [], status: "live" }, "", [])).toBe(true);
  });

  it("matches either selected status, combined with name and tags", () => {
    expect(matchesProject(project, "", [], ["live"])).toBe(true);
    expect(matchesProject(project, "", [], ["archived"])).toBe(false);
    expect(matchesProject(project, "poke", ["Next.js"], ["archived", "live"])).toBe(true);
    expect(matchesProject(project, "lago", [], ["live"])).toBe(false);
    expect(matchesProject(project, "", ["React"], ["live"])).toBe(false);
    expect(matchesProject({ ...project, status: "archived" }, "", [], ["live", "archived"])).toBe(
      true,
    );
    expect(matchesProject({ ...project, status: "wip" }, "", [], ["live", "archived"])).toBe(false);
    expect(matchesProject({ ...project, status: "wip" }, "", [], [])).toBe(true);
  });

  it("formats counts for empty, singular, and plural collections", () => {
    expect(projectResultCount(0, 0)).toBe("0 of 0 projects");
    expect(projectResultCount(0, 1)).toBe("0 of 1 project");
    expect(projectResultCount(1, 4)).toBe("1 of 4 projects");
  });
});
