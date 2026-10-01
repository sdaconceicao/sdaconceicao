interface SearchableProject {
  title: string;
  tech: readonly string[];
}

const normalizeName = (value: string): string =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

export const projectTags = (projects: readonly SearchableProject[]): string[] =>
  [...new Set(projects.flatMap((project) => project.tech))].sort((a, b) => a.localeCompare(b));

/** Filter groups combine; multiple selections within a group match any selection. */
export const matchesProject = (
  project: SearchableProject & { status: string },
  query: string,
  tags: readonly string[],
  statuses: readonly string[] = [],
): boolean =>
  normalizeName(project.title).includes(normalizeName(query)) &&
  (tags.length === 0 || tags.some((tag) => project.tech.includes(tag))) &&
  (statuses.length === 0 || statuses.includes(project.status));
