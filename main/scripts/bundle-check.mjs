import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const LIMIT_MB = 2.5;

export function parseGzipMb(wranglerOutput) {
  const match = wranglerOutput.match(/gzip:\s*([\d.]+)\s*KiB/);
  return match ? Number(match[1]) / 1024 : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const run = spawnSync(
    "pnpm",
    ["exec", "wrangler", "deploy", "--dry-run", "--outdir", "bundled/"],
    { encoding: "utf8" },
  );
  const size = parseGzipMb(run.stdout + run.stderr);

  if (size === null) {
    console.error("No bundle size in the wrangler output. Did the dry run fail?");
    console.error(run.stdout + run.stderr);
    process.exit(1);
  }

  console.log(`Worker bundle ${size.toFixed(2)} MB compressed, limit ${LIMIT_MB.toFixed(2)} MB`);
  process.exit(size > LIMIT_MB ? 1 : 0);
}
