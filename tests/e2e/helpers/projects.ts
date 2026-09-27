import type { Page } from "@playwright/test";
import {
  matchesProject,
  projectResultCount,
} from "../../../src/components/content/ProjectBrowser/ProjectBrowser";
import { findUniqueQuery, parseJsonStringArray, parseProjectStatus } from "./query";

export const STATUS_LABELS = {
  live: "Live",
  wip: "In progress",
  archived: "Archived",
} as const;

export type ProjectStatus = keyof typeof STATUS_LABELS;

export interface CatalogProject {
  title: string;
  href: string;
  tech: string[];
  status: ProjectStatus;
  hasImage: boolean;
}

export interface CatalogProjectData {
  count: number;
  tags: string[];
  projects: CatalogProject[];
}

let cache: Promise<CatalogProjectData> | null = null;

const scrape = async (page: Page): Promise<CatalogProjectData> => {
  await page.goto("/projects");
  const results = page.getByRole("region", { name: "Project results" });
  const cards = await results.locator("[data-project-card]").all();
  const projects: CatalogProject[] = [];

  for (const card of cards) {
    projects.push({
      title: (await card.getAttribute("data-project-title")) ?? "",
      tech: parseJsonStringArray(await card.getAttribute("data-project-tags")),
      status: parseProjectStatus(await card.getAttribute("data-project-status")),
      href: (await card.getByRole("heading").getByRole("link").getAttribute("href")) ?? "",
      hasImage: (await card.locator("img").count()) > 0,
    });
  }

  return {
    count: projects.length,
    tags: [...new Set(projects.flatMap((project) => project.tech))].sort((a, b) =>
      a.localeCompare(b),
    ),
    projects,
  };
};

export const getProjectCatalog = async (page: Page): Promise<CatalogProjectData> => {
  cache ??= scrape(page).catch((error) => {
    cache = null;
    throw error;
  });
  const data = await cache;
  if (!/\/projects\/?$/.test(new URL(page.url()).pathname)) {
    await page.goto("/projects");
  }
  return data;
};

export const matchingProjects = (
  projects: readonly CatalogProject[],
  query = "",
  tags: readonly string[] = [],
  statuses: readonly string[] = [],
): CatalogProject[] => projects.filter((project) => matchesProject(project, query, tags, statuses));

export const expectedProjectCount = (visible: number, total: number): string =>
  projectResultCount(visible, total);

export const findUniqueProjectQuery = (
  projects: readonly CatalogProject[],
): { query: string; project: CatalogProject } | undefined => {
  const found = findUniqueQuery(
    projects,
    (project) => project.title,
    (project, query) => matchesProject(project, query, []),
  );
  return found ? { query: found.query, project: found.item } : undefined;
};

export const findProjectGallery = async (
  page: Page,
  projects: readonly CatalogProject[],
): Promise<{ project: CatalogProject; imageCount: number; alts: string[] } | undefined> => {
  for (const project of projects.filter((item) => item.hasImage && item.href)) {
    await page.goto(project.href);
    const buttons = page
      .getByRole("group", { name: `Choose an image of ${project.title}` })
      .getByRole("button");
    const imageCount = await buttons.count();
    if (imageCount < 2) continue;

    const alts = await Promise.all(
      (await buttons.all()).map(async (button) =>
        (await button.innerText()).trim().replace(/^Show image \d+:\s*/, ""),
      ),
    );
    return { project, imageCount, alts };
  }
};
