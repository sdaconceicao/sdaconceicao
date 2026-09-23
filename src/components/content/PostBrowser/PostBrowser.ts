import { matchesPost, postResultCount } from "../../../lib/posts";

const bindPostBrowser = (browser: HTMLElement) => {
  if (browser.dataset.bound === "true") return;

  const sidebar = browser.querySelector<HTMLElement>("[data-filter-sidebar]");
  const panel = browser.querySelector<HTMLElement>("[data-filter-panel]");
  const drawer = browser.querySelector<HTMLDialogElement>("[data-filter-drawer]");
  const opener = browser.querySelector<HTMLButtonElement>("[data-open-filters]");
  const drawerCount = browser.querySelector<HTMLElement>("[data-drawer-count]");
  const form = browser.querySelector<HTMLFormElement>("[data-post-filters]");
  const search = browser.querySelector<HTMLInputElement>("[data-post-search]");
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
  const inlineFilters = window.matchMedia("(min-width: 26.25rem)");
  let resetTimer: number | undefined;

  const placeFilters = () => {
    const hadFocus = panel.contains(document.activeElement);
    panel.querySelectorAll<HTMLElement>("[popover]:popover-open").forEach((popover) => {
      popover.hidePopover();
    });
    if (drawer.open) drawer.close();
    sidebar.hidden = !inlineFilters.matches;
    opener.hidden = inlineFilters.matches;
    (inlineFilters.matches ? sidebar : drawer).append(panel);
    if (hadFocus) (inlineFilters.matches ? search : opener).focus();
  };

  opener.addEventListener("click", () => drawer.showModal(), listenerOptions);
  panel.querySelectorAll<HTMLButtonElement>("[data-close-filters]").forEach((button) => {
    button.addEventListener("click", () => drawer.close(), listenerOptions);
  });
  drawer.addEventListener(
    "close",
    () => {
      if (!inlineFilters.matches) opener.focus();
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
  inlineFilters.addEventListener("change", placeFilters, listenerOptions);

  const cards = Array.from(
    browser.querySelectorAll<HTMLElement>("[data-post-card]"),
    (element) => ({
      element,
      title: element.dataset.postTitle ?? "",
      description: element.dataset.postDescription ?? "",
      body: element.dataset.postBody ?? "",
      tags: JSON.parse(element.dataset.postTags ?? "[]") as string[],
    }),
  );

  const update = () => {
    const filters = new FormData(form);
    const tags = filters.getAll("tag").map(String);
    let visible = 0;
    for (const card of cards) {
      const matches = matchesPost(card, search.value, tags);
      card.element.hidden = !matches;
      if (matches) visible += 1;
    }
    count.textContent = postResultCount(visible, cards.length);
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

export const initPostBrowsers = () => {
  document.querySelectorAll<HTMLElement>("[data-post-browser]").forEach(bindPostBrowser);
};
