import { expect, type Page } from "@playwright/test";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toggleMultiSelectOption = async (
  page: Page,
  label: string,
  option: string,
  filter = false,
) => {
  await page.getByRole("button", { name: new RegExp(`^${escapeRegExp(label)} `) }).click();
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

export const checkedBoxes = (page: Page) =>
  page.getByRole("checkbox", { checked: true, includeHidden: true });
