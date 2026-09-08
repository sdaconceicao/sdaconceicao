export const matchesOption = (option: string, query: string): boolean =>
  option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

export const selectionSummary = (count: number, placeholder: string): string =>
  count === 0 ? placeholder : `${count} selected`;

interface TriggerBounds {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

/** Fit the popup to the viewport on the side with more available space. */
export const multiSelectPlacement = (
  trigger: TriggerBounds,
  viewport: { width: number; height: number },
  gap: number,
) => {
  const below = Math.max(0, viewport.height - trigger.bottom - gap * 2);
  const above = Math.max(0, trigger.top - gap * 2);
  const opensAbove = above > below;
  const width = Math.min(trigger.width, Math.max(0, viewport.width - gap * 2));
  return {
    width,
    left: Math.max(gap, Math.min(trigger.left, viewport.width - width - gap)),
    edge: opensAbove ? viewport.height - trigger.top + gap : trigger.bottom + gap,
    maxHeight: opensAbove ? above : below,
    opensAbove,
  };
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const isVisible = (element: HTMLElement): boolean =>
  element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";

const adjacentControl = (
  root: HTMLElement,
  trigger: HTMLButtonElement,
  backwards: boolean,
): HTMLElement | undefined => {
  const controls = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => isVisible(element) && (!root.contains(element) || element === trigger),
  );
  const triggerIndex = controls.indexOf(trigger);
  return controls[triggerIndex + (backwards ? -1 : 1)];
};

const bindMultiSelect = (root: HTMLElement) => {
  if (root.dataset.bound === "true") return;

  const trigger = root.querySelector<HTMLButtonElement>("[data-select-trigger]");
  const popover = root.querySelector<HTMLElement>("[popover]");
  const search = root.querySelector<HTMLInputElement>("[data-option-search]");
  const summary = root.querySelector<HTMLElement>("[data-selection-summary]");
  const empty = root.querySelector<HTMLElement>("[data-no-options]");
  const clear = root.querySelector<HTMLButtonElement>("[data-clear-options]");
  if (!trigger || !popover || !summary || !clear) return;

  const options = Array.from(root.querySelectorAll<HTMLElement>("[data-option-label]"));
  const checkboxes = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const controller = new AbortController();
  const listenerOptions = { signal: controller.signal };
  let resetTimer: number | undefined;

  const update = () => {
    let visible = 0;
    for (const option of options) {
      option.hidden = search
        ? !matchesOption(option.dataset.optionLabel ?? "", search.value)
        : false;
      if (!option.hidden) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
    summary.textContent = selectionSummary(
      checkboxes.filter((checkbox) => checkbox.checked).length,
      root.dataset.placeholder ?? "",
    );
  };

  const close = () => {
    if (popover.matches(":popover-open")) popover.hidePopover();
  };

  const placePopover = () => {
    const gap = Number.parseFloat(getComputedStyle(popover).paddingBlockStart) || 0;
    const placement = multiSelectPlacement(
      trigger.getBoundingClientRect(),
      { width: document.documentElement.clientWidth, height: window.innerHeight },
      gap,
    );
    const rtl = getComputedStyle(root).direction === "rtl";
    const inlineStart = rtl
      ? document.documentElement.clientWidth - placement.left - placement.width
      : placement.left;
    popover.style.insetInlineStart = `${inlineStart}px`;
    popover.style.inlineSize = `${placement.width}px`;
    popover.style.insetBlockStart = placement.opensAbove ? "auto" : `${placement.edge}px`;
    popover.style.insetBlockEnd = placement.opensAbove ? `${placement.edge}px` : "auto";
    popover.style.maxBlockSize = `${placement.maxHeight}px`;
  };

  const visibleCheckboxes = () =>
    checkboxes.filter((checkbox) => !checkbox.closest<HTMLElement>("[data-option-label]")?.hidden);

  const moveOptionFocus = (backwards: boolean) => {
    const visible = visibleCheckboxes();
    if (visible.length === 0) return;
    const currentIndex = visible.indexOf(document.activeElement as HTMLInputElement);
    const nextIndex =
      currentIndex === -1
        ? backwards
          ? visible.length - 1
          : 0
        : (currentIndex + (backwards ? -1 : 1) + visible.length) % visible.length;
    visible[nextIndex]?.focus();
  };

  const returnToSearch = (event: KeyboardEvent): boolean => {
    const isTyping =
      event.key.length === 1 &&
      event.key !== " " &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey;
    if (!search || event.target === search || !isTyping) return false;

    event.preventDefault();
    search.focus();
    const insertionPoint = search.value.length;
    search.setRangeText(event.key, insertionPoint, insertionPoint, "end");
    search.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };

  popover.addEventListener(
    "beforetoggle",
    (event) => {
      if ((event as ToggleEvent).newState !== "open") return;
      if (search) search.value = "";
      update();
      placePopover();
    },
    listenerOptions,
  );
  popover.addEventListener(
    "toggle",
    () => {
      if (!popover.matches(":popover-open")) return;
      (search ?? checkboxes[0])?.focus();
    },
    listenerOptions,
  );
  popover.addEventListener(
    "keydown",
    (event) => {
      if (returnToSearch(event)) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveOptionFocus(event.key === "ArrowUp");
        return;
      }
      if (event.key === "Tab") {
        const next = adjacentControl(root, trigger, event.shiftKey);
        close();
        if (next) {
          event.preventDefault();
          next.focus();
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
        trigger.focus();
      }
    },
    listenerOptions,
  );
  root.addEventListener("input", update, listenerOptions);
  clear.addEventListener(
    "click",
    () => {
      for (const checkbox of checkboxes) checkbox.checked = false;
      root.dispatchEvent(new Event("input", { bubbles: true }));
    },
    listenerOptions,
  );

  const form = root.closest("form");
  form?.addEventListener(
    "reset",
    () => {
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        if (search) search.value = "";
        update();
      });
    },
    listenerOptions,
  );
  window.addEventListener("resize", close, listenerOptions);
  document.addEventListener(
    "scroll",
    (event) => {
      if (
        popover.matches(":popover-open") &&
        (!(event.target instanceof Node) || !popover.contains(event.target))
      ) {
        placePopover();
      }
    },
    { capture: true, signal: controller.signal },
  );
  document.addEventListener(
    "astro:before-swap",
    () => {
      close();
      window.clearTimeout(resetTimer);
      controller.abort();
    },
    { once: true },
  );

  root.dataset.bound = "true";
  update();
};

export const initMultiSelects = () => {
  document.querySelectorAll<HTMLElement>("[data-multi-select]").forEach(bindMultiSelect);
};
