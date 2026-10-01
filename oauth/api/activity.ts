const GITHUB_USER = "sdaconceicao";
const QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

type ContributionDay = {
  date: string;
  contributionCount: number;
  contributionLevel:
    | "NONE"
    | "FIRST_QUARTILE"
    | "SECOND_QUARTILE"
    | "THIRD_QUARTILE"
    | "FOURTH_QUARTILE";
};

type GitHubResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          weeks: { contributionDays: ContributionDay[] }[];
        };
      };
    };
  };
  errors?: { message: string }[];
};

const jsonHeaders = {
  "access-control-allow-origin": "*",
  "content-type": "application/json; charset=utf-8",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

export async function GET(): Promise<Response> {
  const token = process.env.GITHUB_ACTIVITY_TOKEN;
  if (!token) {
    return Response.json(
      { error: "Activity is unavailable." },
      { status: 503, headers: jsonHeaders },
    );
  }

  const today = new Date();
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1));
  const to = today.toISOString().slice(0, 10);

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "stephenandrewdesigns-activity",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { login: GITHUB_USER, from: from.toISOString(), to: today.toISOString() },
      }),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const payload = (await response.json()) as GitHubResponse;
    const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
    if (payload.errors?.length || !calendar || !Array.isArray(calendar.weeks)) {
      throw new Error("GitHub returned no contribution calendar");
    }

    return Response.json(
      {
        from: from.toISOString().slice(0, 10),
        to,
        total: calendar.totalContributions,
        days: calendar.weeks.flatMap((week) => week.contributionDays),
      },
      {
        headers: {
          ...jsonHeaders,
          "cache-control": "public, max-age=300",
          "vercel-cdn-cache-control": "max-age=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Activity is temporarily unavailable." },
      {
        status: 502,
        headers: { ...jsonHeaders, "cache-control": "no-store" },
      },
    );
  }
}
