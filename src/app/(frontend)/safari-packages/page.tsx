import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";
import configPromise from "@payload-config";

import { PackageCard, type Package } from "@/components/Cards";
import { ListingFilters } from "@/components/ListingFilters";
import { enrichPackageForCatalog, fetchLinkedTripsByPackageIds } from "@/lib/package-trips";
import {
  PACKAGE_CATEGORY_FILTER_OPTIONS,
  PACKAGE_TIER_FILTER_OPTIONS,
  packageGroupLabel,
  packageGroupsForCategory,
  packageHeroCategoryKey,
  packageTierLabel,
} from "@/lib/package-labels";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PackageSearchParams = {
  category?: string;
  group?: string;
  tier?: string;
};

const packagesMetadata = {
  title: "Safari Packages",
  description:
    "Browse Kenya safari packages, Tanzania safari packages and combined Kenya Tanzania safari adventures by Nature Romp Safaris.",
  path: "/safari-packages",
  keywords:
    "Kenya Tanzania safari packages, Kenya safari packages, Tanzania safari packages, budget safari, private safari",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<PackageSearchParams>;
}): Promise<Metadata> {
  const params = (await searchParams) || {};
  const category = params.category ?? "__all";
  const group = params.group ?? "__all";
  const tier = params.tier ?? "__all";
  const isFiltered = category !== "__all" || group !== "__all" || tier !== "__all";

  return buildMetadata({
    ...packagesMetadata,
    noIndex: isFiltered,
  });
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams?: Promise<PackageSearchParams>;
}) {
  const params = (await searchParams) || {};
  const category = params.category ?? "__all";
  const groupParam = params.group ?? "__all";
  const tier = params.tier ?? "__all";
  const payload = await getPayload({ config: configPromise });
  const visibleGroupsForQuery = packageGroupsForCategory(category);
  const group = visibleGroupsForQuery.some((option) => option.value === groupParam)
    ? groupParam
    : "__all";

  const result = await payload.find({
    collection: "packages",
    where: {
      and: [
        { status: { equals: "published" } },
        ...(category !== "__all" ? [{ category: { equals: category } }] : []),
        ...(group !== "__all" ? [{ packageGroup: { equals: group } }] : []),
        ...(tier !== "__all" ? [{ packageTier: { equals: tier } }] : []),
      ],
    },
    limit: 100,
    depth: 1,
    overrideAccess: true,
    sort: "-updatedAt",
  });

  const rawPackages = result.docs as Array<Package & { id?: string | number }>;
  const tripsByPackageId = await fetchLinkedTripsByPackageIds(
    payload,
    rawPackages.map((item) => item.id).filter((id) => id != null) as Array<string | number>,
  );
  const packages = rawPackages.map((item) => enrichPackageForCatalog(item, tripsByPackageId));

  const activeCategoryLabel =
    PACKAGE_CATEGORY_FILTER_OPTIONS.find((option) => option.value === category)?.label ?? "";
  const visibleGroups = visibleGroupsForQuery;
  const activeGroup = group;
  const isFiltered = category !== "__all" || activeGroup !== "__all" || tier !== "__all";

  return (
    <main className="acc-page packages-page">
      <section
        className="acc-page__hero acc-page__hero--packages"
        data-hero={packageHeroCategoryKey(category)}
      >
        <div className="acc-page__hero-inner">
          <span className="acc-page__eyebrow">Curated Itineraries</span>
          <h1 className="acc-page__title">
            {activeCategoryLabel && category !== "__all"
              ? activeCategoryLabel
              : "Safari Packages"}
          </h1>
          <p className="acc-page__subtitle">
            Browse Kenya, Tanzania, Zanzibar, and combined East Africa safari packages. Filter by
            market, package style, and comfort tier to find the right route for your group.
          </p>
        </div>
      </section>

      <div className="acc-page__layout">
        <aside className="acc-sidebar" aria-label="Safari package filters">
          <ListingFilters
            activeCount={
              (category !== "__all" ? 1 : 0) +
              (activeGroup !== "__all" ? 1 : 0) +
              (tier !== "__all" ? 1 : 0)
            }
          >
          <form action="/safari-packages" className="acc-filter-form" method="get">
            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Market / Destination</h3>
              {PACKAGE_CATEGORY_FILTER_OPTIONS.map(({ label, value }) => (
                <label className="acc-filter-radio" key={value}>
                  <input
                    defaultChecked={category === value}
                    name="category"
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Package Type</h3>
              <select className="acc-filter-select" defaultValue={activeGroup} name="group">
                {visibleGroups.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="acc-filter-group">
              <h3 className="acc-filter-heading">Package Tier</h3>
              {PACKAGE_TIER_FILTER_OPTIONS.map(({ label, value }) => (
                <label className="acc-filter-radio" key={value}>
                  <input defaultChecked={tier === value} name="tier" type="radio" value={value} />
                  {label}
                </label>
              ))}
            </div>

            <button className="acc-filter-btn" type="submit">
              Apply Filters
            </button>

            {isFiltered ? (
              <Link className="acc-filter-clear" href="/safari-packages">
                Clear all filters
              </Link>
            ) : null}
          </form>
          </ListingFilters>
        </aside>

        <section className="acc-results" aria-label="Safari package results">
          <div className="acc-results__header">
            <p className="acc-results__count">
              {packages.length} {packages.length === 1 ? "package" : "packages"} found
            </p>
            {isFiltered ? (
              <span>
                {category !== "__all" ? `Market: ${activeCategoryLabel}` : null}
                {category !== "__all" && activeGroup !== "__all" ? " / " : null}
                {activeGroup !== "__all" ? `Type: ${packageGroupLabel(activeGroup)}` : null}
                {(category !== "__all" || activeGroup !== "__all") && tier !== "__all" ? " / " : null}
                {tier !== "__all" ? `Tier: ${packageTierLabel(tier)}` : null}
              </span>
            ) : null}
          </div>

          {packages.length === 0 ? (
            <div className="acc-empty">
              <p>No safari packages match your filters.</p>
              <Link className="acc-empty-link" href="/safari-packages">
                View all packages →
              </Link>
            </div>
          ) : (
            <div className="acc-grid acc-grid--packages">
              {packages.map((item) => (
                <PackageCard item={item} key={item.slug} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
