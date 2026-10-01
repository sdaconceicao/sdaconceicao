const ENDPOINT = import.meta.env.DEV
  ? "/api/activity"
  : "https://auth.stephenandrewdesigns.com/api/activity";
const SVG_NS = "http://www.w3.org/2000/svg";
const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
} as const;

interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: keyof typeof LEVELS;
}

export interface Activity {
  from: string;
  to: string;
  total: number;
  days: ContributionDay[];
}

const DAY_MS = 86_400_000;

export const parseActivity = (value: unknown): Activity => {
  if (!value || typeof value !== "object") throw new Error("Invalid activity calendar");
  const { from, to, total, days } = value as Record<string, unknown>;
  if (
    typeof from !== "string" ||
    typeof to !== "string" ||
    !Number.isInteger(total) ||
    Number(total) < 0
  ) {
    throw new Error("Invalid activity calendar");
  }
  if (!Array.isArray(days) || !days.length) throw new Error("Empty activity");

  const start = new Date(`${from}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== from) {
    throw new Error("Invalid activity calendar");
  }

  for (const [index, day] of days.entries()) {
    if (!day || typeof day !== "object") throw new Error("Invalid activity calendar");
    const { date, contributionCount, contributionLevel } = day as Record<string, unknown>;
    const expectedDate = new Date(start.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    if (
      date !== expectedDate ||
      !Number.isInteger(contributionCount) ||
      Number(contributionCount) < 0 ||
      typeof contributionLevel !== "string" ||
      !Object.hasOwn(LEVELS, contributionLevel)
    ) {
      throw new Error("Invalid activity calendar");
    }
  }
  if (days.at(-1).date !== to) throw new Error("Invalid activity calendar");
  return value as Activity;
};

export const fetchActivity = async (
  endpoint: string,
  fetcher: typeof fetch = fetch,
): Promise<Activity> => {
  const response = await fetcher(endpoint);
  if (!response.ok) throw new Error(`Activity request failed (${response.status})`);
  return parseActivity(await response.json());
};

export const calendarLayout = (activity: Activity) => {
  const start = new Date(`${activity.from}T00:00:00Z`);
  const end = new Date(`${activity.to}T00:00:00Z`);
  const firstWeekday = start.getUTCDay();
  const weeks = Math.ceil((firstWeekday + activity.days.length) / 7);
  const months: { x: number; label: string }[] = [];
  let lastMonth = -1;
  const cells = activity.days.map((day, index) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const weekday = (firstWeekday + index) % 7;
    const week = Math.floor((firstWeekday + index) / 7);
    const x = 24 + week * 14;
    if (date.getUTCMonth() !== lastMonth) {
      months.push({
        x,
        label: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      });
      lastMonth = date.getUTCMonth();
    }
    return {
      x,
      y: 16 + weekday * 14,
      level: LEVELS[day.contributionLevel],
      tooltip: `${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"} on ${day.date}`,
    };
  });

  return {
    viewBox: `0 0 ${24 + weeks * 14} 118`,
    accessibleName: `${activity.total} GitHub contributions from ${start.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })} to ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`,
    period: `${start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} – ${end.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}`,
    total: `${activity.total.toLocaleString("en-US")} contributions`,
    months,
    cells,
  };
};

function svgElement<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

function renderActivity(root: HTMLElement, activity: Activity): void {
  const calendar = root.querySelector<SVGSVGElement>("[data-activity-calendar]");
  const plot = root.querySelector<HTMLElement>("[data-activity-plot]");
  const period = root.querySelector<HTMLElement>("[data-activity-period]");
  const total = root.querySelector<HTMLElement>("[data-activity-total]");
  const status = root.querySelector<HTMLElement>("[data-activity-status]");
  if (!calendar || !plot || !period || !total || !status) return;

  const layout = calendarLayout(activity);
  calendar.setAttribute("viewBox", layout.viewBox);
  calendar.setAttribute("role", "img");
  calendar.setAttribute("aria-label", layout.accessibleName);
  calendar.replaceChildren();

  for (const [label, row] of [
    ["Mon", 1],
    ["Wed", 3],
    ["Fri", 5],
  ] as const) {
    const text = svgElement("text");
    text.setAttribute("x", "0");
    text.setAttribute("y", String(25 + row * 14));
    text.textContent = label;
    calendar.append(text);
  }

  for (const month of layout.months) {
    const text = svgElement("text");
    text.setAttribute("x", String(month.x));
    text.setAttribute("y", "8");
    text.dataset.monthLabel = "";
    text.textContent = month.label;
    calendar.append(text);
  }

  for (const day of layout.cells) {
    const cell = svgElement("rect");
    cell.setAttribute("x", String(day.x));
    cell.setAttribute("y", String(day.y));
    cell.setAttribute("width", "11");
    cell.setAttribute("height", "11");
    cell.setAttribute("rx", "1");
    cell.dataset.level = String(day.level);
    const tooltip = svgElement("title");
    tooltip.textContent = day.tooltip;
    cell.append(tooltip);
    calendar.append(cell);
  }

  period.textContent = layout.period;
  total.textContent = layout.total;
  status.hidden = true;
  plot.hidden = false;
  total.hidden = false;
}

export function initGitHubActivity(): void {
  const root = document.querySelector<HTMLElement>("[data-github-activity]");
  if (!root || root.dataset.bound === "true") return;
  root.dataset.bound = "true";
  const desktop = window.matchMedia("(min-width: 64rem)");
  const load = async () => {
    if (!desktop.matches || root.dataset.loaded === "true") return;
    root.dataset.loaded = "true";
    try {
      renderActivity(root, await fetchActivity(ENDPOINT));
    } catch {
      root.dataset.loaded = "false";
      const status = root.querySelector<HTMLElement>("[data-activity-status]");
      if (status) status.textContent = "Activity is unavailable right now.";
    }
  };
  void load();
  desktop.addEventListener("change", load);
}
