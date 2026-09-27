import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { checkedBoxes, toggleMultiSelectOption } from "./helpers/filters";
import {
  expectedProjectCount,
  findProjectGallery,
  findUniqueProjectQuery,
  getProjectCatalog,
  matchingProjects,
  STATUS_LABELS,
} from "./helpers/projects";
import { findUniquePrefix } from "./helpers/query";

const toggleSkill = (page: Page, skill: string) =>
  toggleMultiSelectOption(page, "Skills", skill, true);

const toggleStatus = (page: Page, status: string) =>
  toggleMultiSelectOption(page, "Status", status);

for (const width of [390, 1440]) {
  test(`status options combine with other filters and reset at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const { count, projects, tags } = await getProjectCatalog(page);
    test.skip(count === 0, "no projects");

    const mobile = width === 390;
    const opener = page.getByRole("button", { name: "Filters", exact: true });
    if (mobile) await opener.click();
    const filters = page.getByRole(mobile ? "dialog" : "complementary", {
      name: "Filter projects",
    });
    const status = mobile ? filters.getByRole("status") : page.getByRole("status");
    const live = matchingProjects(projects, "", [], ["live"]);
    const liveOrArchived = matchingProjects(projects, "", [], ["live", "archived"]);
    const archived = matchingProjects(projects, "", [], ["archived"]);

    await toggleStatus(page, STATUS_LABELS.live);
    await expect(status).toHaveText(expectedProjectCount(live.length, count));
    await toggleStatus(page, STATUS_LABELS.archived);
    await expect(status).toHaveText(expectedProjectCount(liveOrArchived.length, count));
    await toggleStatus(page, STATUS_LABELS.live);
    await expect(status).toHaveText(expectedProjectCount(archived.length, count));

    const archivedUnique = findUniqueProjectQuery(archived);
    if (mobile) await filters.getByRole("button", { name: "View results" }).click();
    await expect(page.getByRole("article")).toHaveCount(archived.length);
    if (archivedUnique) {
      await expect(page.getByRole("heading", { name: archivedUnique.project.title })).toBeVisible();
    }
    if (mobile) await opener.click();
    await expect(
      page.getByRole("checkbox", {
        name: STATUS_LABELS.archived,
        exact: true,
        includeHidden: true,
      }),
    ).toBeChecked();

    const searchTarget = archivedUnique ?? findUniqueProjectQuery(projects);
    if (searchTarget) {
      await filters.getByRole("searchbox").fill(searchTarget.query);
      const searched = matchingProjects(
        projects,
        searchTarget.query,
        [],
        archivedUnique ? ["archived"] : [],
      );
      await expect(status).toHaveText(expectedProjectCount(searched.length, count));

      const unusedSkill = tags.find((tag) => !searchTarget.project.tech.includes(tag));
      if (unusedSkill) {
        await toggleSkill(page, unusedSkill);
        await expect(status).toHaveText(expectedProjectCount(0, count));
      }
    }

    await filters.getByRole("button", { name: "Clear filters" }).click();
    await expect(status).toHaveText(expectedProjectCount(count, count));
    await expect(
      page.getByRole("checkbox", { name: STATUS_LABELS.live, exact: true, includeHidden: true }),
    ).not.toBeChecked();
    await expect(
      page.getByRole("checkbox", {
        name: STATUS_LABELS.archived,
        exact: true,
        includeHidden: true,
      }),
    ).not.toBeChecked();
    await expect(filters.getByRole("searchbox")).toHaveValue("");
  });
}

test("combines name search with any selected tag, and clears both filters", async ({ page }) => {
  const { count, projects, tags } = await getProjectCatalog(page);
  test.skip(count === 0, "no projects");

  const results = page.getByRole("region", { name: "Project results" });
  const search = page.getByRole("searchbox", { name: "Search by name" });
  await expect(results.getByRole("article")).toHaveCount(count);

  const unique = findUniqueProjectQuery(projects);
  if (unique) {
    await search.fill(`  ${unique.query.toUpperCase()}  `);
    await expect(results.getByRole("article")).toHaveCount(1);
    await expect(results.getByRole("heading", { name: unique.project.title })).toBeVisible();
    await search.press("Enter");
    await expect(search).toHaveValue(`  ${unique.query.toUpperCase()}  `);

    const unusedSkill = tags.find((tag) => !unique.project.tech.includes(tag));
    const usedSkill = unique.project.tech[0];
    if (unusedSkill) {
      await toggleSkill(page, unusedSkill);
      await expect(results.getByRole("article")).toHaveCount(0);
      await expect(results.getByText(/No projects found/)).toBeVisible();
      await expect(results.getByRole("status")).toHaveText(expectedProjectCount(0, count));
    }

    if (usedSkill) {
      await toggleSkill(page, usedSkill);
      const eitherSkill = unusedSkill
        ? matchingProjects(projects, unique.query, [unusedSkill, usedSkill])
        : matchingProjects(projects, unique.query, [usedSkill]);
      await expect(results.getByRole("article")).toHaveCount(eitherSkill.length);

      await search.fill("");
      const eitherSkillAll = unusedSkill
        ? matchingProjects(projects, "", [unusedSkill, usedSkill])
        : matchingProjects(projects, "", [usedSkill]);
      await expect(results.getByRole("article")).toHaveCount(eitherSkillAll.length);

      if (unusedSkill) {
        await toggleSkill(page, unusedSkill);
        await expect(results.getByRole("article")).toHaveCount(
          matchingProjects(projects, "", [usedSkill]).length,
        );
      }
    }
  }

  await search.fill("missing");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(search).toHaveValue("");
  await expect(checkedBoxes(page)).toHaveCount(0);
  await expect(results.getByRole("article")).toHaveCount(count);
  await expect(results.getByRole("status")).toHaveText(expectedProjectCount(count, count));
});

test("supports keyboard filtering and keeps focus in the control", async ({ page }) => {
  const { count, tags, projects } = await getProjectCatalog(page);
  test.skip(count === 0 || tags.length === 0, "no projects or skills");

  const search = page.getByRole("searchbox", { name: "Search by name" });
  await search.focus();
  await page.keyboard.press("Tab");
  const skills = page.getByRole("button", { name: /^Skills / });
  await expect(skills).toBeFocused();
  await skills.press("Enter");
  const optionSearch = page.getByRole("searchbox", { name: "Search skills" });
  await expect(optionSearch).toBeFocused();

  const typed = findUniquePrefix(tags) ?? {
    option: tags[0],
    prefix: tags[0].slice(0, 3),
  };
  await optionSearch.fill(typed.prefix);
  await optionSearch.press("ArrowDown");
  const option = page.getByRole("checkbox", { name: typed.option, exact: true });
  await expect(option).toBeFocused();
  await option.press("v");
  await expect(optionSearch).toBeFocused();
  await expect(optionSearch).toHaveValue(`${typed.prefix}v`);
  await optionSearch.fill(typed.prefix);
  await optionSearch.press("ArrowDown");
  await expect(option).toBeFocused();
  await option.press("Space");
  await expect(option).toBeChecked();
  await option.press("Tab");
  await expect(page.getByRole("button", { name: /^Status / })).toBeFocused();
  await expect(optionSearch).not.toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    expectedProjectCount(matchingProjects(projects, "", [typed.option]).length, count),
  );
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
  const { count, projects, tags } = await getProjectCatalog(page);
  test.skip(count === 0 || tags.length === 0, "no projects or skills");

  const firstSkill = tags[0] ?? "";
  const secondSkill = tags[1];
  await toggleStatus(page, STATUS_LABELS.live);
  await toggleSkill(page, firstSkill);
  const trigger = page.getByRole("button", { name: /^Skills / });
  await expect(trigger).toHaveAccessibleName("Skills 1 selected");
  await trigger.click();
  const search = page.getByRole("searchbox", { name: "Search skills" });
  await expect(search).toHaveValue("");
  await search.fill("no-such-tag");
  await expect(
    page.getByRole("group", { name: "Skills" }).getByText("No matching options."),
  ).toBeVisible();

  if (secondSkill) {
    const prefix = secondSkill.slice(0, 3);
    await search.fill(prefix);
    await page.getByRole("checkbox", { name: secondSkill, exact: true }).check();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(trigger).toHaveAccessibleName("Skills 2 selected");
    await expect(page.getByRole("status")).toHaveText(
      expectedProjectCount(
        matchingProjects(projects, "", [firstSkill, secondSkill], ["live"]).length,
        count,
      ),
    );
  } else {
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }

  await trigger.click();
  await page.getByRole("button", { name: "Clear skills", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(trigger).toHaveAccessibleName("Skills All skills");
  await expect(
    page.getByRole("checkbox", { name: STATUS_LABELS.live, exact: true, includeHidden: true }),
  ).toBeChecked();
  await trigger.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(search).not.toBeVisible();
});

test("keeps skills options clear of controls and anchored during outer scroll", async ({
  page,
}) => {
  const { tags } = await getProjectCatalog(page);
  test.skip(tags.length === 0, "no skills");

  await page.setViewportSize({ width: 1070, height: 884 });
  const trigger = page.getByRole("button", { name: /^Skills / });
  await trigger.click();

  const popover = page
    .getByRole("group", { name: "Skills" })
    .filter({ has: page.getByRole("button", { name: "Done", exact: true }) });
  const options = popover.getByRole("checkbox");
  const finalOption = options.last();
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
    const { count } = await getProjectCatalog(page);
    const sidebar = page.getByRole("complementary", { name: "Filter projects" });
    const results = page.getByRole("region", { name: "Project results" });
    const resultsBox = await results.boundingBox();
    expect(resultsBox).not.toBeNull();
    if (width === 320) {
      await expect(sidebar).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
      await expect(results.getByRole("article")).toHaveCount(count);
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
    }
    await page.getByRole("button", { name: /^Skills / }).click();
    const popupScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(popupScan.violations).toEqual([]);
  });
}

test("keeps the filter rail fixed while project results grow", async ({ page }) => {
  const { projects } = await getProjectCatalog(page);
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
    const articleWithImage = page.locator("article:has(img)").first();
    if ((await articleWithImage.count()) > 0) {
      thumbnailLayouts.push(
        await articleWithImage.evaluate((article) => {
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
  }

  expect(filterWidths).toEqual([256, 256, 256, 256, 256, 256]);
  expect(filterPositions).toEqual([88, 112, 112, 112, 112, 112]);
  expect(resultWidths[1]).toBeGreaterThan(resultWidths[0] ?? 0);
  expect(resultWidths[5]).toBeGreaterThan(resultWidths[1] ?? 0);
  expect(fontSizes.every((sizes) => sizes.join() === fontSizes[0]?.join())).toBe(true);
  if (projects.some((project) => project.hasImage)) {
    expect(thumbnailLayouts.length).toBeGreaterThan(0);
    expect(
      thumbnailLayouts.every(
        ({ topOffset, ratio, objectFit }) =>
          Math.abs(topOffset - 1) <= 1 &&
          Math.abs(ratio - 16 / 9) <= 0.01 &&
          objectFit === "contain",
      ),
    ).toBe(true);
  }
});

test("uses compact project cards through the middle viewport range", async ({ page }) => {
  const { count } = await getProjectCatalog(page);
  test.skip(count === 0, "no projects");

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
    const cardCount = await cards.count();
    const [header, firstCard, secondCard, resultsBox] = await Promise.all([
      page.locator("header").boundingBox(),
      cards.nth(0).boundingBox(),
      cardCount > 1 ? cards.nth(1).boundingBox() : Promise.resolve(null),
      results.boundingBox(),
    ]);
    const image = cards.nth(0).locator("img");
    const imageBox = (await image.count()) > 0 ? await image.boundingBox() : null;
    const filtersBox = width >= 420 ? await filters.boundingBox() : null;
    expect(header).not.toBeNull();
    expect(firstCard).not.toBeNull();
    if (header && firstCard) {
      expect(Math.round(header.width)).toBe(width < 420 ? width : 64);
    }
    if (header && firstCard && secondCard) {
      expect(Math.abs(firstCard.y - secondCard.y) <= 1).toBe(sameRow);
    }
    if (imageBox) {
      expect(Math.abs(imageBox.width / imageBox.height - 16 / 9)).toBeLessThanOrEqual(0.01);
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
  const { count, projects, tags } = await getProjectCatalog(page);
  test.skip(count === 0, "no projects");

  await page.setViewportSize({ width: 390, height: 600 });
  const opener = page.getByRole("button", { name: "Filters", exact: true });
  const drawer = page.getByRole("dialog", { name: "Filter projects" });
  await opener.click();
  await expect(drawer.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  const viewResults = drawer.getByRole("button", { name: "View results" });
  await viewResults.focus();
  await page.keyboard.press("Tab");
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

  const unique = findUniqueProjectQuery(projects);
  const skill = unique?.project.tech[0] ?? tags[0];
  if (unique) {
    await drawer.getByRole("searchbox").fill(unique.query);
    if (skill) await toggleSkill(page, skill);
    const visible = matchingProjects(projects, unique.query, skill ? [skill] : []);
    await expect(drawer.getByRole("status")).toHaveText(
      expectedProjectCount(visible.length, count),
    );
    await viewResults.click();
    await expect(drawer).not.toBeVisible();
    await expect(opener).toBeFocused();
    await expect(page.getByRole("article")).toHaveCount(visible.length);
    if (visible.length === 1) {
      await expect(page.getByRole("heading", { name: unique.project.title })).toBeVisible();
    }

    await opener.click();
    await expect(drawer.getByRole("searchbox")).toHaveValue(unique.query);
  } else {
    await viewResults.click();
    await opener.click();
  }

  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.mouse.click(389, 300);
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await drawer.getByRole("button", { name: "Clear filters" }).click();
  await expect(drawer.getByRole("status")).toHaveText(expectedProjectCount(count, count));
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(opener).toBeFocused();
  await expect(page.getByRole("article")).toHaveCount(count);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe(
    "hidden",
  );
});

test("switching between drawer and sidebar preserves filters and releases the modal", async ({
  page,
}) => {
  const { count, projects } = await getProjectCatalog(page);
  test.skip(count === 0, "no projects");

  await page.setViewportSize({ width: 390, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Filter projects" });
  expect(await drawer.evaluate((element) => getComputedStyle(element).animationDuration)).toBe(
    "0.001s",
  );
  const unique = findUniqueProjectQuery(projects);
  const query = unique?.query ?? "lago";
  await drawer.getByRole("searchbox").fill(query);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(drawer).not.toBeVisible();
  const sidebar = page.getByRole("complementary", { name: "Filter projects" });
  await expect(sidebar.getByRole("searchbox")).toHaveValue(query);
  await expect(sidebar.getByRole("searchbox")).toBeFocused();
  await expect(page.getByRole("article")).toHaveCount(matchingProjects(projects, query).length);
  await page.setViewportSize({ width: 390, height: 800 });
  const opener = page.getByRole("button", { name: "Filters", exact: true });
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(drawer.getByRole("searchbox")).toHaveValue(query);
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
  const { count, projects } = await getProjectCatalog(page);
  await expect(page.getByRole("article")).toHaveCount(count);
  if (projects[0]) {
    await expect(page.getByRole("link", { name: projects[0].title, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  expect((await page.getByRole("region", { name: "Project results" }).boundingBox())?.x).toBe(400);
  await context.close();
});

test("switches the project gallery with thumbnails and wrapping controls", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  const { projects } = await getProjectCatalog(page);
  const gallery = await findProjectGallery(page, projects);
  test.skip(!gallery, "no project has gallery images");
  if (!gallery) return;

  const { project, imageCount, alts } = gallery;
  const thumbnails = page.getByRole("group", {
    name: `Choose an image of ${project.title}`,
  });
  const buttons = thumbnails.getByRole("button");
  const hero = page.getByRole("img").first();
  await expect(buttons).toHaveCount(imageCount);
  const [heroBox, thumbnailsBox, previousBox, nextBox, galleryBox, articleBox, objectFit] =
    await Promise.all([
      hero.boundingBox(),
      thumbnails.boundingBox(),
      page.getByRole("button", { name: "Previous image" }).boundingBox(),
      page.getByRole("button", { name: "Next image" }).boundingBox(),
      page.locator("[data-project-gallery]").boundingBox(),
      page.getByRole("article").boundingBox(),
      hero.evaluate((image) => getComputedStyle(image).objectFit),
    ]);
  expect(heroBox).not.toBeNull();
  expect(thumbnailsBox).not.toBeNull();
  expect(previousBox).not.toBeNull();
  expect(nextBox).not.toBeNull();
  expect(galleryBox).not.toBeNull();
  expect(articleBox).not.toBeNull();
  expect(objectFit).toBe("cover");
  if (heroBox && thumbnailsBox && previousBox && nextBox && galleryBox && articleBox) {
    expect(Math.abs(heroBox.width / heroBox.height - 16 / 9)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(heroBox.x - thumbnailsBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(heroBox.width - thumbnailsBox.width)).toBeLessThanOrEqual(1);
    expect(galleryBox.y + galleryBox.height).toBeLessThanOrEqual(articleBox.y + articleBox.height);
    for (const control of [previousBox, nextBox]) {
      expect(control.y).toBeGreaterThanOrEqual(heroBox.y);
      expect(control.y + control.height).toBeLessThanOrEqual(heroBox.y + heroBox.height);
    }
  }

  const lastIndex = imageCount - 1;
  const lastAlt = alts[lastIndex];
  const firstAlt = alts[0];
  await buttons.nth(lastIndex).click();
  if (lastAlt) {
    await expect(page.getByRole("img", { name: lastAlt })).toBeVisible();
  }
  await expect(buttons.nth(lastIndex)).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Next image" }).click();
  if (firstAlt) {
    await expect(page.getByRole("img", { name: firstAlt })).toBeVisible();
  }
  await page.getByRole("button", { name: "Previous image" }).click();
  await expect(buttons.nth(lastIndex)).toHaveAttribute("aria-pressed", "true");

  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
});
