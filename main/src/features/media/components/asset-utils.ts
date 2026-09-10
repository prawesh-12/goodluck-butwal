export type ResourceType = "image" | "video";

export function fileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// The same rule as folderOf in queries.ts, repeated because that module reaches the database and
// cannot be pulled into the browser bundle.
export function folderName(publicId: string) {
  const parts = publicId.split("/");
  return parts.length > 1 ? parts[parts.length - 2] : "general";
}

const GENERIC = "Something went wrong. Try again in a moment.";

// The backend answers in prose written for a developer. These are the sentences that name a file
// host or a repository, which nobody using the admin should have to read.
export function plainError(message: string | undefined, type: ResourceType) {
  const noun = type === "video" ? "video" : "image";
  if (!message) return GENERIC;
  if (message.includes("ships with the site")) {
    return `This ${noun} is part of the site design, so only a developer can change it.`;
  }
  if (message.includes("Cloudinary")) return `That file was refused. Check the format and try again.`;
  return message;
}

export type Usage = { kind: string; label: string };
export type DeleteBlock = { items: Usage[]; more: number; message: string };

// deleteAsset refuses in one sentence, and that sentence is the only place the names of the
// things still pointing at the file appear. Reading them back out turns the refusal into a list.
const NAMED = /([A-Za-z][A-Za-z ]*?) "([^"]*)"/g;
const IN_USE = "Still in use by";

export function deleteBlock(error: string, type: ResourceType): DeleteBlock {
  if (error.startsWith(IN_USE)) {
    const rest = error.slice(IN_USE.length);
    return {
      items: [...rest.matchAll(NAMED)].map(([, kind, label]) => ({ kind: kind.trim(), label })),
      more: Number(rest.match(/and (\d+) more/)?.[1] ?? 0),
      message: "It is currently used by:",
    };
  }

  const bodies = error.match(/inside (\d+) article/);
  if (bodies) {
    const count = Number(bodies[1]);
    return {
      items: [],
      more: 0,
      message: `It appears inside ${count} news ${count === 1 ? "article" : "articles"}. Take it out there first.`,
    };
  }

  return { items: [], more: 0, message: plainError(error, type) };
}
