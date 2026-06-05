import type { Metadata } from "next";

import { site } from "@/content/site";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  image?: string;
};

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords,
  image = "/assets/img/banner1.webp",
}: SeoInput): Metadata {
  const url = `${site.canonicalUrl}${path === "/" ? "" : path}`;
  const fullTitle = `${title} | ${site.company}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.name,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: site.company,
    url: site.canonicalUrl,
    email: site.email,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Embassy House, Mezazanine-Harambee Avenue",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    areaServed: ["Kenya", "Tanzania", "East Africa"],
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.canonicalUrl}${item.url}`,
    })),
  };
}
