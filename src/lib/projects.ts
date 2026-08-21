import type { CollectionEntry } from "astro:content";

type Project = CollectionEntry<"projects">;

/** Featured first, then explicit `order`, then title. Fully deterministic. */
export const sortProjects = (projects: Project[]): Project[] =>
  [...projects].sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    if (a.data.order !== b.data.order) return a.data.order - b.data.order;
    return a.data.title.localeCompare(b.data.title);
  });

export const selectFeatured = (projects: Project[]): Project[] =>
  sortProjects(projects).filter((p) => p.data.featured);

/** The canonical outbound link: a live site beats a repo. */
export const primaryHref = (project: Project): string | undefined =>
  project.data.url ?? project.data.repo;
