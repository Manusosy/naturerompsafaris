import { describe, expect, it } from "vitest";

import type { PublicNavItem } from "@/lib/public-navigation";

import type { PublicDestinationNavItem } from "@/lib/public-destinations";

import {
  buildDestinationPreviewByCountry,
  buildHeaderNavigation,
  getMenuVariant,
} from "./header-navigation-model";

const sampleNavigation: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about", items: [{ label: "Our Team", href: "/about#team" }] },
  {
    label: "Destinations",
    href: "/destinations",
    items: [
      { label: "Kenya", href: "/destinations?country=Kenya" },
      { label: "Tanzania", href: "/destinations?country=Tanzania" },
      { label: "Zanzibar", href: "/destinations/zanzibar" },
    ],
  },
  {
    label: "Safari Tours",
    href: "/trips",
    items: [{ label: "Kenya Safaris", href: "/safari-packages?category=Kenya%20Safaris" }],
  },
  {
    label: "Packages",
    href: "/safari-packages",
    items: [{ label: "Luxury", href: "/safari-packages?tier=luxury" }],
  },
  {
    label: "Experiences",
    href: "/safari-packages",
    items: [{ label: "Family Safaris", href: "/safari-packages?experience=family" }],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Request Quote", href: "/contact", isPrimaryAction: true },
];

describe("buildHeaderNavigation", () => {
  it("normalizes the header to the audited FlashMC-style navigation surface", () => {
    const items = buildHeaderNavigation(sampleNavigation);

    expect(items.map((item) => item.label)).toEqual([
      "About Us",
      "Destinations",
      "Safari Tours",
      "Experiences",
      "Accommodation",
      "National Parks",
      "Blog",
      "Contact Us",
    ]);

    expect(items.find((item) => item.label === "Accommodation")?.items).toEqual([
      { label: "Kenya", href: "/accommodations?country=kenya" },
      { label: "Tanzania", href: "/accommodations?country=tanzania" },
    ]);
    expect(items.find((item) => item.label === "Accommodation")?.href).toBe("/accommodations");
    expect(items.find((item) => item.label === "Contact Us")?.href).toBe("/contact");
  });
});

describe("getMenuVariant", () => {
  it("marks the interaction pattern expected by each audited dropdown", () => {
    expect(getMenuVariant("About Us")).toBe("simple");
    expect(getMenuVariant("Destinations")).toBe("dynamic");
    expect(getMenuVariant("Safari Tours")).toBe("simple");
    expect(getMenuVariant("Experiences")).toBe("mega");
    expect(getMenuVariant("Accommodation")).toBe("simple");
    expect(getMenuVariant("National Parks")).toBe("mega");
  });
});

const sampleDestinations: PublicDestinationNavItem[] = [
  {
    country: "kenya",
    name: "Masai Mara",
    region: "Southwest Kenya",
    slug: "masai-mara",
    summary: "Great migration country.",
  },
  {
    country: "tanzania",
    name: "Serengeti",
    region: "Northern Tanzania",
    slug: "serengeti",
    summary: "Endless plains.",
  },
  {
    country: "tanzania",
    name: "Zanzibar",
    region: "Indian Ocean",
    slug: "zanzibar",
    summary: "Spice island beaches.",
  },
];

describe("buildDestinationPreviewByCountry", () => {
  it("groups published destinations by country for the dynamic flyout", () => {
    const previews = buildDestinationPreviewByCountry(sampleDestinations);

    expect(previews.Kenya.map((row) => row.label)).toEqual(["Masai Mara"]);
    expect(previews.Tanzania.map((row) => row.label)).toEqual(["Serengeti"]);
    expect(previews.Zanzibar.map((row) => row.label)).toEqual(["Zanzibar"]);
    expect(previews.Kenya[0]?.href).toBe("/destinations/masai-mara");
  });
});

describe("buildHeaderNavigation with destinations", () => {
  it("builds National Parks mega columns from published destinations", () => {
    const items = buildHeaderNavigation(sampleNavigation, sampleDestinations);
    const nationalParks = items.find((item) => item.label === "National Parks");

    expect(nationalParks?.megaColumns?.map((column) => column.heading)).toEqual(["Kenya", "Tanzania"]);
    expect(nationalParks?.megaColumns?.[0]?.items.map((item) => item.label)).toEqual(["Masai Mara"]);
    expect(nationalParks?.megaColumns?.[1]?.items.map((item) => item.label)).toEqual(["Serengeti", "Zanzibar"]);
  });
});
