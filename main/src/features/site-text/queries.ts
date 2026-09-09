import { allUiStrings } from "@db/ui-strings";

export type Text = (key: string, fallback: string) => string;

// The fallback is passed in at the point of use, which means the wording in the code IS the
// default. An admin's edit overrides it; clearing their edit falls back here rather than showing
// a blank space, and no column is needed to remember what the default was.
export async function loadText(): Promise<Text> {
  const strings = await allUiStrings();
  return (key, fallback) => {
    const value = strings.get(key);
    return value && value.trim() ? value : fallback;
  };
}
