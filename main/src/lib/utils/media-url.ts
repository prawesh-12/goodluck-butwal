export type MediaRow = {
  kind: "static" | "cloudinary" | null;
  staticPath: string | null;
  cloudinaryPublicId: string | null;
};

// Same rule as the admin picker, kept here so a public page never imports an admin module.
export function mediaUrl(row: MediaRow, width = 640) {
  if (row.kind !== "cloudinary") return row.staticPath ?? "";
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/${row.cloudinaryPublicId}`;
}
