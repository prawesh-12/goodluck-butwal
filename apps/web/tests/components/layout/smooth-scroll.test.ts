import { afterEach, beforeEach, expect, test, vi } from "vitest";

// No DOM environment is installed, so the mount effect is captured through a stubbed React and run by hand.
const effects: (() => void | (() => void))[] = [];
vi.mock("react", () => ({
  useEffect: (fn: () => void | (() => void)) => { effects.push(fn); },
  useRef: <T,>(v: T) => ({ current: v }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const handlers: Record<string, () => void> = {};
const lenis = {
  time: 12345,
  isScrolling: false as false | "smooth" | "native",
  raf: vi.fn(),
  on: vi.fn((event: string, fn: () => void) => { handlers[event] = fn; }),
  scrollTo: vi.fn(),
  destroy: vi.fn(),
};
vi.mock("lenis", () => ({ default: function Lenis() { return lenis; } }));

const raf = vi.fn<(fn: (t: number) => void) => number>();
let frame: ((t: number) => void) | null = null;

beforeEach(() => {
  effects.length = 0;
  raf.mockReset();
  lenis.raf.mockReset();
  raf.mockImplementation((fn: (t: number) => void) => { frame = fn; return 1; });
  vi.stubGlobal("requestAnimationFrame", raf);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q === "(pointer: fine)" }));
  vi.stubGlobal("document", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("window", { scrollTo: vi.fn() });
});
afterEach(() => { vi.unstubAllGlobals(); frame = null; lenis.isScrolling = false; lenis.time = 12345; });

async function mount() {
  const { SmoothScroll } = await import("@/components/layout/smooth-scroll");
  SmoothScroll();
  for (const fn of effects) fn();
  await new Promise((r) => setTimeout(r, 0));
}

test("no frame loop is requested at mount", async () => {
  await mount();
  expect(lenis.on).toHaveBeenCalledWith("virtual-scroll", expect.any(Function));
  expect(raf).not.toHaveBeenCalled();
});

test("wheel input starts the loop with a reset clock and it stops once lenis is idle", async () => {
  await mount();
  handlers["virtual-scroll"]();
  expect(lenis.time).toBe(0);
  expect(raf).toHaveBeenCalledTimes(1);

  lenis.isScrolling = "smooth";
  frame!(100);
  expect(lenis.raf).toHaveBeenCalledWith(100);
  expect(raf).toHaveBeenCalledTimes(2);

  lenis.isScrolling = false;
  frame!(116);
  expect(raf).toHaveBeenCalledTimes(2);

  handlers["virtual-scroll"]();
  expect(raf).toHaveBeenCalledTimes(3);
});

test("a second wheel event while the loop runs does not start another loop", async () => {
  await mount();
  handlers["virtual-scroll"]();
  lenis.isScrolling = "smooth";
  handlers["virtual-scroll"]();
  expect(raf).toHaveBeenCalledTimes(1);
});
