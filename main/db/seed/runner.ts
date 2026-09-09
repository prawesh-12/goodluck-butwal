export type SeedResult = { name: string; rows: number };

const steps: { name: string; run: () => Promise<number> }[] = [];

export function step(name: string, run: () => Promise<number>) {
  steps.push({ name, run });
}

// Every step matches on a natural key and upserts, so running the seed twice changes nothing.
export async function runAll(): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  for (const { name, run } of steps) {
    const rows = await run();
    results.push({ name, rows });
    console.log(`  ${name}: ${rows}`);
  }
  return results;
}
