import type { Page } from "@playwright/test";
import {
  matchesProject,
  projectResultCount,
} from "../../../src/components/content/ProjectBrowser/ProjectBrowser";
import { findUniquePrefix, findUniqueQuery } from "./query";

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
  statuses: ProjectStatus[];
  projects: CatalogProject[];
}

let cache: Promise<CatalogProjectData> | null = null;

const parseTags = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const tags: unknown = JSON.parse(value);
    return Array.isArray(tags) && tags.every((tag) => typeof tag === "string") ? tags : [];
  } catch {
    return [];
  }
};

const parseStatus = (value: string | null): ProjectStatus =>
  value === "archived" || value === "wip" ? value : "live";

const scrape = async (page: Page): Promise<CatalogProjectData> => {
  await page.goto("/projects");
  const results = page.getByRole("region", { name: "Project results" });
  const cards = await results.locator("[data-project-card]").all();
  const projects: CatalogProject[] = [];

  for (const card of cards) {
    projects.push({
      title: (await card.getAttribute("data-project-title")) ?? "",
      tech: parseTags(await card.getAttribute("data-project-tags")),
      status: parseStatus(await card.getAttribute("data-project-status")),
      href: (await card.getByRole("heading").getByRole("link").getAttribute("href")) ?? "",
      hasImage: (await card.locator("img").count()) > 0,
    });
  }

  return {
    count: projects.length,
    tags: [...new Set(projects.flatMap((project) => project.tech))].sort((a, b) =>
      a.localeCompare(b),
    ),
    statuses: [...new Set(projects.map((project) => project.status))],
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

export const findSkillPrefix = (tags: readonly string[]) => findUniquePrefix(tags);

export const findProjectGallery = async (
  page: Page,
  projects: readonly CatalogProject[],
): Promise<{ project: CatalogProject; imageCount: number; alts: string[] } | undefined> => {
  for (const project of projects.filter((item) => item.hasImage && item.href)) {
    await page.goto(project.href);
    const thumbnails = page.getByRole("group", {
      name: `Choose an image of ${project.title}`,
    });
    const buttons = thumbnails.getByRole("button");
    const imageCount = await buttons.count();
    if (imageCount < 2) continue;

    const alts: string[] = [];
    for (const button of await buttons.all()) {
      const label = (await button.innerText()).trim();
      alts.push(label.replace(/^Show image \d+:\s*/, ""));
    }
    return { project, imageCount, alts };
  }

  const single = projects.find((project) => project.hasImage && project.href);
  if (!single) return undefined;
  await page.goto(single.href);
  return { project: single, imageCount: 1, alts: [] };
};
