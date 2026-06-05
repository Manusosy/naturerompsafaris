import configPromise from "@payload-config";
import { getPayload } from "payload";

import { site } from "@/content/site";

export type PublicSiteSettings = {
  address: string;
  companyName: string;
  description: string;
  email: string;
  facebook?: string;
  instagram?: string;
  phone: string;
  twitter?: string;
  whatsapp: string;
  youtube?: string;
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const payload = await getPayload({ config: configPromise });
    const settings = await payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      slug: "site-settings" as never,
    }) as Record<string, unknown>;

    return {
      address: String(settings.address || "Nairobi, Kenya"),
      companyName: String(settings.companyName || site.company),
      description: String(settings.footerDescription || "Nature Romp Safaris crafts custom Kenya and Tanzania safari adventures with clear planning and local expertise."),
      email: String(settings.primaryEmail || "info@naturerompsafaris.com"),
      facebook: typeof settings.facebook === "string" ? settings.facebook : undefined,
      instagram: typeof settings.instagram === "string" ? settings.instagram : undefined,
      phone: String(settings.phone || site.phone),
      twitter: typeof settings.twitter === "string" ? settings.twitter : undefined,
      whatsapp: String(settings.whatsapp || site.whatsapp),
      youtube: typeof settings.youtube === "string" ? settings.youtube : undefined,
    };
  } catch {
    return {
      address: "Nairobi, Kenya",
      companyName: site.company,
      description: "Nature Romp Safaris crafts custom Kenya and Tanzania safari adventures with clear planning and local expertise.",
      email: "info@naturerompsafaris.com",
      phone: site.phone,
      whatsapp: site.whatsapp,
    };
  }
}
