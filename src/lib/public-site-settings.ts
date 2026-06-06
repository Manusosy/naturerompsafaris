import configPromise from "@payload-config";
import { getPayload } from "payload";

import { site } from "@/content/site";

export type FooterQuickLink = {
  href: string;
  label: string;
};

export type PublicSiteSettings = {
  address: string;
  companyName: string;
  description: string;
  email: string;
  facebook?: string;
  instagram?: string;
  phone: string;
  quickLinks: FooterQuickLink[];
  siteName: string;
  twitter?: string;
  tiktok?: string;
  whatsapp: string;
  whatsappEnquiryMessage: string;
  youtube?: string;
};

function parseQuickLinks(value: unknown): FooterQuickLink[] {
  if (!Array.isArray(value)) return site.footerQuickLinks;

  const links = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = String(record.label ?? "").trim();
      const href = String(record.href ?? "").trim();
      if (!label || !href) return null;
      return { href, label };
    })
    .filter((item): item is FooterQuickLink => item !== null);

  return links.length ? links : site.footerQuickLinks;
}

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
      description: String(settings.footerDescription || site.footerDescription),
      email: String(settings.primaryEmail || "info@naturerompsafaris.com"),
      facebook: typeof settings.facebook === "string" ? settings.facebook : undefined,
      instagram: typeof settings.instagram === "string" ? settings.instagram : undefined,
      phone: String(settings.phone || site.phone),
      quickLinks: parseQuickLinks(settings.footerQuickLinks),
      siteName: String(settings.siteName || site.name),
      twitter: typeof settings.twitter === "string" ? settings.twitter : undefined,
      whatsapp: String(settings.whatsapp || site.whatsapp),
      whatsappEnquiryMessage: String(
        settings.whatsappEnquiryMessage ||
          "Hello Nature Romp Safaris! I'd like help planning my Kenya/Tanzania safari. Could you guide me on destinations, travel dates, group size, and the best options for my trip?",
      ),
      youtube: typeof settings.youtube === "string" ? settings.youtube : undefined,
      tiktok: typeof settings.tiktok === "string" ? settings.tiktok : undefined,
    };
  } catch {
    return {
      address: "Nairobi, Kenya",
      companyName: site.company,
      description: site.footerDescription,
      email: "info@naturerompsafaris.com",
      phone: site.phone,
      quickLinks: site.footerQuickLinks,
      siteName: site.name,
      whatsapp: site.whatsapp,
      whatsappEnquiryMessage:
        "Hello Nature Romp Safaris! I'd like help planning my Kenya/Tanzania safari. Could you guide me on destinations, travel dates, group size, and the best options for my trip?",
    };
  }
}
