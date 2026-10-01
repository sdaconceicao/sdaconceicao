import { existsSync } from "node:fs";
import { join } from "node:path";

// Keep local Astro development on the same activity handler Vercel deploys.
// This middleware is never included in the static production build.
export const activityDevPlugin = () => ({
  name: "activity-dev-api",
  apply: "serve",
  configureServer(server) {
    const envFile = join(server.config.root, ".env");
    if (existsSync(envFile)) process.loadEnvFile(envFile);

    server.middlewares.use("/api/activity", async (request, response, next) => {
      if (request.method !== "GET") {
        response.writeHead(405, { allow: "GET" });
        response.end();
        return;
      }

      try {
        const { GET } = await server.ssrLoadModule("/oauth/api/activity.ts");
        const result = await GET();
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
      } catch (error) {
        next(error);
      }
    });
  },
});
