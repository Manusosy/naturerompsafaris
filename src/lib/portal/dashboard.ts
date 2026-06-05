import { cache } from "react";

import { countCollection, findCollection } from "@/lib/portal/data";

export type DashboardSnapshot = {
  recentEnquiries: Array<Record<string, unknown>>;
  totalAccommodations: number;
  totalDestinations: number;
  totalEnquiries: number;
  totalPackages: number;
};

export const getDashboardSnapshot = cache(async (): Promise<DashboardSnapshot> => {
  const [totalEnquiries, totalAccommodations, totalDestinations, totalPackages, recentEnquiries] =
    await Promise.all([
      countCollection("enquiries"),
      countCollection("accommodations"),
      countCollection("destinations"),
      countCollection("packages"),
      findCollection("enquiries", 6, undefined, 1, "-createdAt"),
    ]);

  const recentEnquiryDocs = Array.isArray(recentEnquiries.docs)
    ? (recentEnquiries.docs as Array<Record<string, unknown>>)
    : [];

  return {
    recentEnquiries: recentEnquiryDocs,
    totalAccommodations,
    totalDestinations,
    totalEnquiries,
    totalPackages,
  };
});
