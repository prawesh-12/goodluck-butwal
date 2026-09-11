import { cache } from "react";
import { TAGS, cached } from "@/lib/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@goodluck/db";
import { destinations, institutionImages, institutions, mediaAssets } from "@goodluck/db/schema";
import { mediaUrl } from "@/lib/utils/media-url";

export type PublicInstitution = {
  slug: string;
  name: string;
  logo: string;
  city: string;
  country: string;
  destination: string;
  destinationSlug: string;
  website: string;
  isPartner: boolean;
  descriptionHtml: string;
};

const listInstitutionsUncached = cached(async (): Promise<PublicInstitution[]> => {
  const rows = await db
    .select({
      slug: institutions.slug,
      name: institutions.name,
      city: institutions.city,
      country: institutions.country,
      website: institutions.websiteUrl,
      isPartner: institutions.isPartner,
      descriptionHtml: institutions.descriptionHtml,
      destination: destinations.name,
      destinationSlug: destinations.slug,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(institutions)
    .leftJoin(destinations, eq(institutions.destinationId, destinations.id))
    .leftJoin(mediaAssets, eq(institutions.logoId, mediaAssets.id))
    .where(eq(institutions.status, "published"))
    .orderBy(desc(institutions.isFeatured), asc(institutions.name));

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    logo: mediaUrl(row, 640),
    city: row.city ?? "",
    country: row.country ?? "",
    destination: row.destination ?? "",
    destinationSlug: row.destinationSlug ?? "",
    website: row.website ?? "",
    isPartner: row.isPartner,
    descriptionHtml: row.descriptionHtml ?? "",
  }));
}, ["institutions"], [TAGS.institutions]);

export const listInstitutions = cache(listInstitutionsUncached);

export const getInstitution = cache(async (slug: string) =>
  (await listInstitutions()).find((i) => i.slug === slug),
);

export type GalleryImage = { src: string; caption: string };

const listInstitutionImagesUncached = cached(async (slug: string): Promise<GalleryImage[]> => {
  const rows = await db
    .select({
      caption: institutionImages.caption,
      kind: mediaAssets.kind,
      staticPath: mediaAssets.staticPath,
      cloudinaryPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(institutionImages)
    .innerJoin(institutions, eq(institutionImages.institutionId, institutions.id))
    .innerJoin(mediaAssets, eq(institutionImages.mediaId, mediaAssets.id))
    .where(and(eq(institutions.slug, slug), eq(institutions.status, "published")))
    .orderBy(asc(institutionImages.sortOrder));

  return rows.map((row) => ({ src: mediaUrl(row, 640), caption: row.caption ?? "" }));
}, ["institution-images"], [TAGS.institutions]);

export const listInstitutionImages = cache(listInstitutionImagesUncached);
