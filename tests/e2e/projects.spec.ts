import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const toggleMultiSelectOption = async (
  page: Page,
  label: string,
  option: string,
  filter = false,
) => {
  await page.getByRole("button", { name: new RegExp(`^${label} `) }).click();
  if (filter) {
    await page.getByRole("searchbox", { name: `Search ${label.toLowerCase()}` }).fill(option);
  }
  const checkbox = page.getByRole("checkbox", { name: option, exact: true });
  await checkbox.click();
  await checkbox.press("Escape");
  const popover = page
    .getByRole("group", { name: label })
    .filter({ has: page.getByRole("button", { name: "Done" }) });
  await expect(popover).not.toBeVisible();
};

const toggleSkill = (page: Page, skill: string) =>
  toggleMultiSelectOption(page, "Skills", skill, true);

const toggleStatus = (page: Page, status: string) =>
  toggleMultiSelectOption(page, "Status", status);

for (const width of [390, 1440]) {
  test(`status options combine with other filters and reset at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects");
    const mobile = width === 390;
    const opener = page.getByRole("button", { name: "Filters", exact: true });
    if (mobile) await opener.click();
    const filters = page.getByRole(mobile ? "dialog" : "complementary", {
      name: "Filter projects",
    });
    const count = mobile ? filters.getByRole("status") : page.getByRole("status");
    const live = filters.locator('input[name="status"][value="live"]');
    const archived = filters.locator('input[name="status"][value="archived"]');
    await toggleStatus(page, "Live");
    await expect(count).toHaveText("2 of 4 projects");
    await toggleStatus(page, "Archived");
    await expect(count).toHaveText("3 of 4 projects");
    await toggleStatus(page, "Live");
    await expect(count).toHaveText("1 of 4 projects");
    if (mobile) await filters.getByRole("button", { name: "View results" }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Cookbookery" })).toBeVisible();
    if (mobile) await opener.click();
    await expect(archived).toBeChecked();
    await filters.getByRole("searchbox").fill("cook");
    await expect(count).toHaveText("1 of 4 projects");
    await toggleSkill(page, "TypeScript");
    await expect(count).toHaveText("0 of 4 projects");
    await filters.getByRole("button", { name: "Clear filters" }).click();
    await expect(count).toHaveText("4 of 4 projects");
    await expect(live).not.toBeChecked();
    await expect(archived).not.toBeChecked();
    await expect(filters.getByRole("searchbox")).toHaveValue("");
  });
}

test("combines name search with any selected tag, and clears both filters", async ({ page }) => {
  await page.goto("/projects");
  const results = page.getByRole("region", { name: "Project results" });
  const search = page.getByRole("searchbox", { name: "Search by name" });
  await expect(results.getByRole("article")).toHaveCount(4);
  await search.fill("  POKEPENDIUM  ");
  await expect(results.getByRole("article")).toHaveCount(1);
  await expect(results.getByRole("heading", { name: "Poképendium" })).toBeVisible();
  await search.press("Enter");
  await expect(search).toHaveValue("  POKEPENDIUM  ");

  await toggleSkill(page, "React");
  await expect(results.getByRole("article")).toHaveCount(0);
  await expect(results.getByText(/No projects found/)).toBeVisible();
  await expect(results.getByRole("status")).toHaveText("0 of 4 projects");

  await toggleSkill(page, "Next.js");
  await expect(results.getByRole("article")).toHaveCount(1);
  await search.fill("");
  await expect(results.getByRole("article")).toHaveCount(4);
  await toggleSkill(page, "React");
  await expect(results.getByRole("article")).toHaveCount(1);

  await search.fill("missing");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expect(results.getByRole("article")).toHaveCount(4);
  await expect(results.getByRole("status")).toHaveText("4 of 4 projects");
});

test("supports keyboard filtering and keeps focus in the control", async ({ page }) => {
  await page.goto("/projects");
  const search = page.getByRole("searchbox", { name: "Search by name" });
  await search.focus();
  await page.keyboard.press("Tab");
  const skills = page.getByRole("button", { name: /^Skills / });
  await expect(skills).toBeFocused();
  await skills.press("Enter");
  const optionSearch = page.getByRole("searchbox", { name: "Search skills" });
  await expect(optionSearch).toBeFocused();
  await optionSearch.fill("Graph");
  await optionSearch.press("ArrowDown");
  const option = page.getByRole("checkbox", { name: "GraphQl", exact: true });
  await expect(option).toBeFocused();
  await option.press("v");
  await expect(optionSearch).toBeFocused();
  await expect(optionSearch).toHaveValue("Graphv");
  await optionSearch.fill("Graph");
  await optionSearch.press("ArrowDown");
  await expect(option).toBeFocused();
  await option.press("Space");
  await expect(option).toBeChecked();
  await option.press("Tab");
  await expect(page.getByRole("button", { name: /^Status / })).toBeFocused();
  await expect(optionSearch).not.toBeVisible();
  await expect(page.getByRole("status")).toHaveText("1 of 4 projects");
});

test("omits search by default and keeps the unfiltered popover aligned", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/projects");
  const trigger = page.getByRole("button", { name: /^Status / });
  const triggerBox = await trigger.boundingBox();
  const chevronBox = await trigger.locator("svg").boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(chevronBox).not.toBeNull();
  if (triggerBox && chevronBox) {
    const triggerCenter = triggerBox.y + triggerBox.height / 2;
    const chevronCenter = chevronBox.y + chevronBox.height / 2;
    expect(Math.abs(chevronCenter - triggerCenter)).toBeLessThanOrEqual(1);
  }
  await trigger.click();

  const popover = page
    .getByRole("group", { name: "Status" })
    .filter({ has: page.getByRole("button", { name: "Done" }) });
  const live = page.getByRole("checkbox", { name: "Live", exact: true });
  const inProgress = page.getByRole("checkbox", { name: "In progress", exact: true });
  const archived = page.getByRole("checkbox", { name: "Archived", exact: true });
  await expect(popover).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search status" })).toHaveCount(0);
  await expect(live).toBeFocused();

  const popoverBox = await popover.boundingBox();
  expect(popoverBox).not.toBeNull();
  if (triggerBox && popoverBox) {
    expect(Math.abs(popoverBox.x - triggerBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(popoverBox.width - triggerBox.width)).toBeLessThanOrEqual(1);
    expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(1440);
  }

  await live.press("ArrowDown");
  await expect(inProgress).toBeFocused();
  await inProgress.press("ArrowDown");
  await expect(archived).toBeFocused();
  await archived.press("ArrowUp");
  await expect(inProgress).toBeFocused();
  await inProgress.press("Space");
  await expect(trigger).toHaveAccessibleName("Status 1 selected");
  await inProgress.press("Tab");
  await expect(page.getByRole("button", { name: "Clear filters" })).toBeFocused();
  await expect(popover).not.toBeVisible();
});

test("searching skills preserves selections, handles no matches, and clears skills independently", async ({
  page,
}) => {
  await page.goto("/projects");
  await toggleStatus(page, "Live");
  await toggleSkill(page, "React");
  const trigger = page.getByRole("button", { name: /^Skills / });
  await expect(trigger).toHaveAccessibleName("Skills 1 selected");
  await trigger.click();
  const search = page.getByRole("searchbox", { name: "Search skills" });
  await expect(search).toHaveValue("");
  await search.fill("no-such-tag");
  await expect(
    page.getByRole("group", { name: "Skills" }).getByText("No matching options."),
  ).toBeVisible();
  await search.fill("Next");
  await page.getByRole("checkbox", { name: "Next.js", exact: true }).check();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("Skills 2 selected");
  await expect(page.getByRole("status")).toHaveText("2 of 4 projects");
  await trigger.click();
  await page.getByRole("button", { name: "Clear skills", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("Skills All skills");
  await expect(page.locator('input[name="status"][value="live"]')).toBeChecked();
  await trigger.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(search).not.toBeVisible();
});

test("keeps skills options clear of controls and anchored during outer scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1070, height: 884 });
  await page.goto("/projects");
  const trigger = page.getByRole("button", { name: /^Skills / });
  await trigger.click();

  const popover = page
    .getByRole("group", { name: "Skills" })
    .filter({ has: page.getByRole("button", { name: "Done", exact: true }) });
  const finalOption = page.getByRole("checkbox", { name: "Vite", exact: true });
  const done = popover.getByRole("button", { name: "Done", exact: true });
  await finalOption.focus();

  const finalOptionBox = await finalOption.boundingBox();
  const doneBox = await done.boundingBox();
  expect(finalOptionBox).not.toBeNull();
  expect(doneBox).not.toBeNull();
  if (finalOptionBox && doneBox) {
    expect(finalOptionBox.y + finalOptionBox.height).toBeLessThanOrEqual(doneBox.y);
  }

  await finalOption.check();
  const initialTriggerBox = await trigger.boundingBox();
  const initialPopoverBox = await popover.boundingBox();
  expect(initialTriggerBox).not.toBeNull();
  expect(initialPopoverBox).not.toBeNull();
  const initialGap =
    initialTriggerBox && initialPopoverBox
      ? initialPopoverBox.y - (initialTriggerBox.y + initialTriggerBox.height)
      : 0;

  await page.evaluate(() => window.scrollBy(0, 300));
  await expect(popover).toBeVisible();
  await expect(finalOption).toBeChecked();

  const scrolledTriggerBox = await trigger.boundingBox();
  const scrolledPopoverBox = await popover.boundingBox();
  expect(scrolledTriggerBox).not.toBeNull();
  expect(scrolledPopoverBox).not.toBeNull();
  if (scrolledTriggerBox && scrolledPopoverBox) {
    const scrolledGap = scrolledPopoverBox.y - (scrolledTriggerBox.y + scrolledTriggerBox.height);
    expect(Math.abs(scrolledGap - initialGap)).toBeLessThanOrEqual(1);
  }
});

for (const width of [320, 1440]) {
  test(`filters reflow and pass accessibility checks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects");
    const sidebar = page.getByRole("complementary", { name: "Filter projects" });
    const results = page.getByRole("region", { name: "Project results" });
    const resultsBox = await results.boundingBox();
    expect(resultsBox).not.toBeNull();
    if (width === 320) {
      await expect(sidebar).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
      await expect(results.getByRole("article")).toHaveCount(4);
    } else {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox).not.toBeNull();
      if (sidebarBox && resultsBox) {
        expect(resultsBox.x).toBeGreaterThan(sidebarBox.x + sidebarBox.width);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(scan.violations).toEqual([]);
    if (width === 320) {
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      const drawer = page.getByRole("dialog", { name: "Filter projects" });
      await expect(drawer).toBeVisible();
      const drawerScan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(drawerScan.violations).toEqual([]);
      expect(await drawer.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(288);
      await page.screenshot({ path: "/tmp/project-filter-drawer.png" });
    }
    await page.getByRole("button", { name: /^Skills / }).click();
    const popupScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(popupScan.violations).toEqual([]);
    await page.screenshot({ path: `/tmp/local-multiselect-${width}.png` });
  });
}

test("keeps the filter rail fixed while project results grow", async ({ page }) => {
  const filterWidths: number[] = [];
  const filterPositions: number[] = [];
  const resultWidths: number[] = [];
  const fontSizes: string[][] = [];
  const thumbnailLayouts: {
    topOffset: number;
    ratio: number;
    objectFit: string;
  }[] = [];
  for (const width of [1024, 1440, 1599, 1600, 1601, 1800]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects");
    await page.evaluate(() => document.fonts.ready);
    const [filters, results] = await Promise.all([
      page.getByRole("complementary", { name: "Filter projects" }).boundingBox(),
      page.getByRole("region", { name: "Project results" }).boundingBox(),
    ]);
    filterWidths.push(filters?.width ?? 0);
    filterPositions.push(filters?.x ?? 0);
    resultWidths.push(results?.width ?? 0);
    fontSizes.push(
      await page
        .locator("body, h1, aside h2, [data-result-count]")
        .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).fontSize)),
    );
    thumbnailLayouts.push(
      await page
        .locator("article:has(img)")
        .first()
        .evaluate((article) => {
          const image = article.querySelector("img");
          if (!image) throw new Error("Expected project thumbnail");
          const cardRect = article.getBoundingClientRect();
          const imageRect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return {
            topOffset: imageRect.top - cardRect.top,
            ratio: imageRect.width / imageRect.height,
            objectFit: style.objectFit,
          };
        }),
    );
  }

  expect(filterWidths).toEqual([256, 256, 256, 256, 256, 256]);
  expect(filterPositions).toEqual([88, 112, 112, 112, 112, 112]);
  expect(resultWidths[1]).toBeGreaterThan(resultWidths[0] ?? 0);
  expect(resultWidths[5]).toBeGreaterThan(resultWidths[1] ?? 0);
  expect(fontSizes.every((sizes) => sizes.join() === fontSizes[0]?.join())).toBe(true);
  expect(
    thumbnailLayouts.every(
      ({ topOffset, ratio, objectFit }) =>
        Math.abs(topOffset - 1) <= 1 && Math.abs(ratio - 1.5) <= 0.01 && objectFit === "contain",
    ),
  ).toBe(true);
});

test("uses compact project cards through the middle viewport range", async ({ page }) => {
  for (const [width, sameRow] of [
    [390, false],
    [420, false],
    [767, false],
    [768, true],
    [1023, true],
    [1024, true],
    [1289, true],
    [1290, false],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects");
    const cards = page.getByRole("article");
    const filters = page.getByRole("complementary", { name: "Filter projects" });
    const results = page.getByRole("region", { name: "Project results" });
    const [header, firstCard, secondCard, image, resultsBox] = await Promise.all([
      page.locator("header").boundingBox(),
      cards.nth(0).boundingBox(),
      cards.nth(1).boundingBox(),
      cards.nth(0).locator("img").boundingBox(),
      results.boundingBox(),
    ]);
    const filtersBox = width >= 420 ? await filters.boundingBox() : null;
    expect(header).not.toBeNull();
    expect(firstCard).not.toBeNull();
    expect(secondCard).not.toBeNull();
    expect(image).not.toBeNull();
    if (header && firstCard && secondCard && image) {
      expect(Math.round(header.width)).toBe(width < 420 ? width : 64);
      expect(Math.abs(firstCard.y - secondCard.y) <= 1).toBe(sameRow);
      expect(Math.abs(image.width / image.height - 1.5)).toBeLessThanOrEqual(0.01);
    }
    if (width < 420) {
      await expect(filters).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
    } else {
      await expect(filters).toBeVisible();
      await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeHidden();
      expect(filtersBox).not.toBeNull();
      expect(resultsBox).not.toBeNull();
      if (filtersBox && resultsBox && width < 1024) {
        expect(Math.abs(filtersBox.x - resultsBox.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(filtersBox.width - resultsBox.width)).toBeLessThanOrEqual(1);
        expect(resultsBox.y).toBeGreaterThan(filtersBox.y + filtersBox.height);
      }
    }
  }
});

test("mobile drawer traps focus, applies filters, and restores focus on dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/projects");
  const opener = page.getByRole("button", { name: "Filters", exact: true });
  const drawer = page.getByRole("dialog", { name: "Filter projects" });
  await opener.click();
  await expect(drawer.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  const viewResults = drawer.getByRole("button", { name: "View results" });
  await viewResults.focus();
  await page.keyboard.press("Tab");
  // Native dialogs can include browser chrome in the cycle, but never the page behind them.
  expect(
    await drawer.evaluate(
      (element) => !document.hasFocus() || element.contains(document.activeElement),
    ),
  ).toBe(true);
  await opener.focus();
  await expect(opener).not.toBeFocused();
  await drawer.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  expect(
    await drawer.evaluate(
      (element) => !document.hasFocus() || element.contains(document.activeElement),
    ),
  ).toBe(true);
  await drawer.getByRole("searchbox").fill("lago");
  await toggleSkill(page, "React");
  await expect(drawer.getByRole("status")).toHaveText("1 of 4 projects");
  await viewResults.click();
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Code-X / Lago" })).toBeVisible();

  await opener.click();
  await expect(drawer.getByRole("searchbox")).toHaveValue("lago");
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.mouse.click(389, 300);
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await drawer.getByRole("button", { name: "Clear filters" }).click();
  await expect(drawer.getByRole("status")).toHaveText("4 of 4 projects");
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(opener).toBeFocused();
  await expect(page.getByRole("article")).toHaveCount(4);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe(
    "hidden",
  );
});

test("switching between drawer and sidebar preserves filters and releases the modal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Filter projects" });
  expect(await drawer.evaluate((element) => getComputedStyle(element).animationDuration)).toBe(
    "0.001s",
  );
  await drawer.getByRole("searchbox").fill("lago");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(drawer).not.toBeVisible();
  const sidebar = page.getByRole("complementary", { name: "Filter projects" });
  await expect(sidebar.getByRole("searchbox")).toHaveValue("lago");
  await expect(sidebar.getByRole("searchbox")).toBeFocused();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 800 });
  const opener = page.getByRole("button", { name: "Filters", exact: true });
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(drawer.getByRole("searchbox")).toHaveValue("lago");
});

test("keeps the desktop result track and project links stable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1600, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("/projects");
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Poképendium", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  expect((await page.getByRole("region", { name: "Project results" }).boundingBox())?.x).toBe(400);
  await context.close();
});
