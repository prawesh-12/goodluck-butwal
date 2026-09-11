import { allUiStrings } from "@/db/ui-strings";

export type Text = (key: string, fallback: string) => string;

// The fallback at the call site is the default, so no column has to remember it. Clearing an
// admin edit falls back here rather than showing a blank.
export async function loadText(): Promise<Text> {
  const strings = await allUiStrings();
  return (key, fallback) => {
    const value = strings.get(key);
    return value && value.trim() ? value : fallback;
  };
}
