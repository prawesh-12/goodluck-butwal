import { z } from "zod";
import { contentStatuses, httpsUrl, mediaId } from "@/lib/validators/fields";

const fields = {
  name: z.string().trim().min(1, "Give the partner a name."),
  logoId: mediaId,
  websiteUrl: httpsUrl,
  isFeatured: z.boolean().default(false),
  status: z.enum(contentStatuses),
};

export const createPartnerSchema = z.object(fields);
export const updatePartnerSchema = z.object({ id: z.uuid(), ...fields });

export const reorderPartnersSchema = z.object({ ids: z.array(z.uuid()).min(1) });

export type PartnerInput = z.infer<typeof createPartnerSchema>;

export function partnerPublishProblems(data: PartnerInput, logoAlt: string | null | undefined): string[] {
  const missing: string[] = [];
  if (!data.logoId) missing.push("Logo");
  if (data.logoId && !logoAlt) missing.push("Alt text on the logo");
  return missing;
}
