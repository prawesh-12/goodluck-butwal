import { vi } from "vitest";

// unstable_cache needs a Next request or build context to find the incremental cache, and a
// vitest process has neither, so the query passes straight through to the real database.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}));
