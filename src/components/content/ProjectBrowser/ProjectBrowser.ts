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

export const projectResultCount = (visible: number, total: number): string =>
  `${visible} of ${total} ${total === 1 ? "project" : "projects"}`;

const parseTags = (value: string | undefined): string[] => {
  if (!value) return [];
  try {
    const tags: unknown = JSON.parse(value);
    return Array.isArray(tags) && tags.every((tag) => typeof tag === "string") ? tags : [];
  } catch {
    return [];
  }
};

const bindProjectBrowser = (browser: HTMLElement) => {
  if (browser.dataset.bound === "true") return;

  const sidebar = browser.querySelector<HTMLElement>("[data-filter-sidebar]");
  const panel = browser.querySelector<HTMLElement>("[data-filter-panel]");
  const drawer = browser.querySelector<HTMLDialogElement>("[data-filter-drawer]");
  const opener = browser.querySelector<HTMLButtonElement>("[data-open-filters]");
  const drawerCount = browser.querySelector<HTMLElement>("[data-drawer-count]");
  const form = browser.querySelector<HTMLFormElement>("[data-project-filters]");
  const search = browser.querySelector<HTMLInputElement>("[data-project-name]");
  const count = browser.querySelector<HTMLElement>("[data-result-count]");
  const empty = browser.querySelector<HTMLElement>("[data-empty-state]");
  if (
    !sidebar ||
    !panel ||
    !drawer ||
    !opener ||
    !drawerCount ||
    !form ||
    !search ||
    !count ||
    !empty
  ) {
    return;
  }

  const controller = new AbortController();
  const listenerOptions = { signal: controller.signal };
  const desktop = window.matchMedia("(min-width: 64rem)");
  let resetTimer: number | undefined;

  const placeFilters = () => {
    const hadFocus = panel.contains(document.activeElement);
    panel.querySelectorAll<HTMLElement>("[popover]:popover-open").forEach((popover) => {
      popover.hidePopover();
    });
    if (drawer.open) drawer.close();
    sidebar.hidden = !desktop.matches;
    opener.hidden = desktop.matches;
    (desktop.matches ? sidebar : drawer).append(panel);
    if (hadFocus) (desktop.matches ? search : opener).focus();
  };

  opener.addEventListener("click", () => drawer.showModal(), listenerOptions);
  panel.querySelectorAll<HTMLButtonElement>("[data-close-filters]").forEach((button) => {
    button.addEventListener("click", () => drawer.close(), listenerOptions);
  });
  drawer.addEventListener(
    "close",
    () => {
      if (!desktop.matches) opener.focus();
    },
    listenerOptions,
  );
  drawer.addEventListener(
    "click",
    (event) => {
      if (event.target !== drawer) return;
      const bounds = drawer.getBoundingClientRect();
      const outside =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;
      if (outside) drawer.close();
    },
    listenerOptions,
  );
  desktop.addEventListener("change", placeFilters, listenerOptions);

  const cards = Array.from(
    browser.querySelectorAll<HTMLElement>("[data-project-card]"),
    (element) => ({
      element,
      title: element.dataset.projectTitle ?? "",
      tech: parseTags(element.dataset.projectTags),
      status: element.dataset.projectStatus ?? "",
    }),
  );

  const update = () => {
    const filters = new FormData(form);
    const tags = filters.getAll("tag").map(String);
    const statuses = filters.getAll("status").map(String);
    let visible = 0;
    for (const card of cards) {
      const matches = matchesProject(card, search.value, tags, statuses);
      card.element.hidden = !matches;
      if (matches) visible += 1;
    }
    count.textContent = projectResultCount(visible, cards.length);
    drawerCount.textContent = count.textContent;
    empty.hidden = visible > 0;
  };

  form.addEventListener("submit", (event) => event.preventDefault(), listenerOptions);
  form.addEventListener("input", update, listenerOptions);
  form.addEventListener(
    "reset",
    () => {
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(update);
    },
    listenerOptions,
  );
  document.addEventListener(
    "astro:before-swap",
    () => {
      if (drawer.open) drawer.close();
      window.clearTimeout(resetTimer);
      controller.abort();
    },
    { once: true },
  );

  browser.dataset.bound = "true";
  placeFilters();
  update();
};

export const initProjectBrowsers = () => {
  document.querySelectorAll<HTMLElement>("[data-project-browser]").forEach(bindProjectBrowser);
};
