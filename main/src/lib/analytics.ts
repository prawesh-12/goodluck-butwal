const GTM_SHAPE = /^GTM-[A-Z0-9]+$/;

// Anything that is not a real container id renders nothing, so a blank setting, a leftover
// placeholder or a pasted GA4 id cannot put a broken tag on every page.
export function gtmId(fromSettings?: unknown): string | null {
  const id = String(fromSettings ?? "").trim() || (process.env.NEXT_PUBLIC_GTM_ID ?? "").trim();
  return GTM_SHAPE.test(id) ? id : null;
}

export const formNames = ["enquiry", "booking", "event_registration", "test_prep_registration"] as const;
export type FormName = (typeof formNames)[number];

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function trackFormSubmit(form: FormName, reference?: string) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: "form_submit", form_name: form, ...(reference ? { reference } : {}) });
}
