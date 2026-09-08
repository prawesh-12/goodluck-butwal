// Excluded from tsconfig on purpose: it imports the worker that `pnpm build:worker` generates,
// which does not exist when the type check runs. Keep it thin enough to read in one go.
//
// A Cloudflare cron fires a `scheduled` event, but the generated OpenNext worker only exports
// `fetch`. This wraps it so the */15 trigger reaches the publish route. Everything else is
// handed straight through.
import handler from "./.open-next/worker.js";

export { BucketCachePurge } from "./.open-next/.build/durable-objects/bucket-cache-purge.js";

// Declared here rather than pulling in @cloudflare/workers-types, which is not on the approved
// dependency list and is only needed for these two shapes.
type ExecutionContext = { waitUntil: (promise: Promise<unknown>) => void };
type Env = { CRON_SECRET?: string; NEXT_PUBLIC_SITE_URL?: string };

const worker = {
  fetch: handler.fetch,

  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext) {
    const base = env.NEXT_PUBLIC_SITE_URL ?? "https://goodluck.services";
    const request = new Request(`${base}/api/cron/publish-scheduled`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ""}` },
    });
    ctx.waitUntil(handler.fetch(request, env, ctx));
  },
};

export default worker;
