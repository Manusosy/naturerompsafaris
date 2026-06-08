# SEO Strategy — Nature Romp Safaris

This document describes how SEO is handled on the Next.js + Payload CMS site, what has been implemented, and the recommended ongoing plan. It replaces the need for WordPress plugins such as Rank Math or Yoast by building equivalent capabilities into the stack.

**Production domain:** `https://kenyatanzaniasafariadventures.com`  
**Required env:** `NEXT_PUBLIC_SITE_URL=https://kenyatanzaniasafariadventures.com`

---

## How this compares to WordPress SEO plugins

| Rank Math / Yoast feature | Our implementation |
|---|---|
| Title & meta description | `buildMetadata()` in `src/lib/seo.ts` |
| Canonical URLs | `alternates.canonical` on every page |
| Open Graph / Twitter cards | Same helper |
| robots.txt | `src/app/robots.ts` |
| XML sitemap | `src/app/(frontend)/sitemap.ts` + `src/lib/sitemap-data.ts` |
| Organization schema | Site-wide `TravelAgency` JSON-LD in frontend layout |
| Article schema | Blog post detail pages |
| Breadcrumb schema | Hub, destination, blog, and trip pages |
| Per-content SEO fields | `seo` group on Posts, Trips, Packages, Destinations, Accommodations |
| Legacy URL redirects | `next.config.ts` redirects (`.html` paths + `/travel-blog`) |
| noindex on thin/filter URLs | `noIndex` option on listing pages with active filters |
| Redirect manager (CMS) | **Not yet** — add Payload collection or config when old URLs are discovered |
| SERP preview / character counts in editor | **Not yet** — Phase 3 |
| Blog category archive URLs | **Not yet** — Phase 4 (`/blog/category/{slug}`) |
| FAQ / Product / Tour rich schema | **Partial** — Article + Organization done; FAQ schema on trips is Phase 5 |

---

## Implemented (Phase 2 — technical fixes)

Deployed in commit introducing this document.

### Duplicate URL consolidation

- **301 redirect:** `/travel-blog` → `/blog` (`next.config.ts`)
- Removed duplicate route at `src/app/(frontend)/travel-blog/page.tsx`
- **Canonical blog listing:** `/blog` only

### Sitemap improvements

File: `src/app/(frontend)/sitemap.ts`, helper: `src/lib/sitemap-data.ts`

- Includes **published CMS content only** (posts, packages, trips, destinations, accommodations)
- **Paginated fetch** (250 docs per page) — no silent 100-URL cap
- **`lastModified`** from CMS `updatedAt` or `publishedAt` when available
- Static listing routes added: `/trips`, `/destinations`, `/accommodations`
- Hub pages from `seoHubs` in `src/content/site.ts` remain included
- Legacy static slugs in `site.ts` are merged and deduplicated with CMS routes

**Submit to search engines:**  
`https://kenyatanzaniasafariadventures.com/sitemap.xml`

### Filtered listing pages — noindex

Filtered views use `robots: { index: false, follow: true }` while canonical still points to the clean listing URL (no query string).

| Page | Filter params |
|---|---|
| `/blog` | `category`, `q` |
| `/trips` | `country`, `experience`, `tier`, `minDays`, `maxDays` |
| `/safari-packages` | `category`, `group`, `tier` |
| `/accommodations` | `country`, `type`, `location`, `min`, `max` |

Implementation: `generateMetadata()` on each listing page + `noIndex` in `buildMetadata()`.

### Legacy redirects (existing)

| Source | Destination |
|---|---|
| `/index.html` | `/` |
| `/about.html` | `/about` |
| `/contact.html` | `/contact` |
| `/blog.html` | `/blog` |
| `/travel-blog` | `/blog` |
| `/blog-details.html` | `/blog/why-choose-east-africa-tour-operators` |
| `/package-listing.html` | `/safari-packages` |
| `/photo-gallary.html` | `/photo-gallery` |
| `/tour-details.html` | `/safari-packages` |

Add new legacy WordPress URLs here as they appear in Google Search Console.

---

## Already in place (pre–Phase 2)

- **`src/lib/seo.ts`** — shared metadata builder
- **`src/app/robots.ts`** — allows `/`, disallows `/admin`, `/cms-admin`, `/api`
- **Blog URLs** — `/blog` (listing), `/blog/{slug}` (posts) — good flat structure for SEO
- **CMS SEO groups** — auto canonical URL hooks on Posts; manual SEO on Trips, Packages, etc.
- **Trip wizard SEO fields** — title, description, keywords in portal (`TripWizard.tsx`)
- **Article auto-fill** — Posts hook sets `metaTitle` / `metaDescription` from title and excerpt on save

---

## Google Search Console setup (do after each production deploy)

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property:
   - **Recommended:** Domain property for `kenyatanzaniasafariadventures.com` (DNS TXT verification), or
   - **URL prefix:** `https://kenyatanzaniasafariadventures.com`
3. Submit sitemap: `https://kenyatanzaniasafariadventures.com/sitemap.xml`
4. Optionally add [Bing Webmaster Tools](https://www.bing.com/webmasters) with the same sitemap.
5. Confirm production `NEXT_PUBLIC_SITE_URL` matches the live domain (canonicals and sitemap depend on this).

### Post-deploy verification checklist

- [ ] `/travel-blog` returns **301** to `/blog`
- [ ] `/sitemap.xml` lists published URLs only, with sensible `lastmod` dates
- [ ] `/robots.txt` references the sitemap URL
- [ ] View source on `/blog?category=foo` — `noindex` present, canonical is `/blog`
- [ ] View source on a blog post — title, description, canonical, Article JSON-LD
- [ ] Rich Results Test passes for homepage (Organization) and a sample blog post (Article)

### Monthly GSC review

- **Pages** — indexed vs not indexed
- **Sitemaps** — discovered vs submitted URL count
- **Page indexing** — duplicate canonical issues (should decrease after `/travel-blog` fix)
- **Performance** — queries with high impressions but low CTR → improve titles/descriptions
- **Not found (404)** — add redirects in `next.config.ts` for old WordPress paths

---

## Recommended next phases

### Phase 3 — CMS editor UX (Yoast-like sidebar)

**Goal:** Editors manage SEO without developer involvement.

1. Surface hidden SEO fields on Posts (meta title, meta description, OG image)
2. Character-count hints (~60 title, ~155 description) with green/yellow/red states
3. Simple Google SERP preview component in article/trip editors
4. Slug checklist on publish (lowercase, hyphens, topic-aligned with H1)
5. Per-page `noindex` checkbox for utility pages
6. Require alt text on media uploads used in hero/OG contexts

**Primary files:** `src/collections/Posts.ts`, `src/components/portal/ArticleEditor.tsx`, `src/components/portal/TripWizard.tsx`

### Phase 4 — Content architecture

1. **Blog category archives** — `/blog/category/{slug}` (indexable hub pages; replace query-string filters for SEO)
2. **Internal linking guidelines** (editorial):
   - Each blog post → 2–3 internal links (trip, package, destination)
   - Each trip/package → link to relevant blog posts and destinations
   - Hub pages → link down to packages and trips
3. **Title templates** (document for editors):

   | Content type | Template |
   |---|---|
   | Trip | `{Duration} {Destination} Safari \| Nature Romp Safaris` |
   | Package | `{Package Name} \| Kenya/Tanzania Safari Packages` |
   | Blog | `{Topic} \| East Africa Safari Guide` |
   | Destination | `{Place} Safari Guide \| Kenya/Tanzania` |

### Phase 5 — Rich results & trust

Add schema only where it matches **visible** page content:

| Schema | Pages |
|---|---|
| `FAQPage` | Trips and blog posts with FAQ sections |
| `TouristTrip` / `Product` | Trip and package detail pages |
| `BreadcrumbList` | Extend consistently to all detail templates |
| Enhanced `TravelAgency` | Add geo coordinates, opening hours if applicable |

Validate with [Google Rich Results Test](https://search.google.com/test/rich-results).

### Phase 6 — Redirect manager (optional)

When GSC reports many legacy 404s:

- Payload `redirects` collection (source path, destination, permanent flag), or
- Maintain a JSON/TS map merged into `next.config.ts` redirects

Prefer 301 permanent redirects for old WordPress URLs.

---

## External tools (outside the repo)

| Tool | Purpose |
|---|---|
| Google Search Console | Indexing, queries, crawl errors — **essential** |
| Bing Webmaster Tools | Secondary index |
| Google Analytics 4 | Traffic and conversion events (contact, WhatsApp, inquiry) |
| PageSpeed Insights / CrUX | Core Web Vitals |
| Rich Results Test | Structured data validation |
| Screaming Frog (free tier) | Periodic full-site crawl |

Optional later: Ahrefs or Semrush for keyword research and backlinks.

---

## What not to do

- Do not install a heavy third-party SEO SDK — metadata is owned in Next.js.
- Do not rely on meta keywords for rankings — Google ignores them; optional for internal notes only.
- Do not change live URL structures without 301 redirects and GSC monitoring.
- Do not add JSON-LD that does not match visible page content.

---

## Key source files

| File | Role |
|---|---|
| `src/lib/seo.ts` | Metadata, Organization schema, Breadcrumb schema |
| `src/lib/sitemap-data.ts` | Paginated CMS route fetch for sitemap |
| `src/app/(frontend)/sitemap.ts` | XML sitemap generation |
| `src/app/robots.ts` | robots.txt |
| `next.config.ts` | Legacy and duplicate URL redirects |
| `src/content/site.ts` | `canonicalUrl`, static hubs, legacy slugs |
| `src/collections/Posts.ts` | Post SEO fields and auto-fill hooks |
| `src/collections/Trips.ts` | Trip SEO fields |
| `src/app/(frontend)/blog/[slug]/page.tsx` | Article metadata + JSON-LD |

---

## Content & publishing checklist (for editors)

Before publishing any post, trip, or package:

1. **Slug** — short, descriptive, lowercase with hyphens (e.g. `best-time-masai-mara-safari`)
2. **Title (H1)** — clear topic; SEO title can differ slightly for SERP length
3. **Meta description** — unique, 120–155 characters, includes a reason to click
4. **Hero / OG image** — relevant, compressed, with descriptive alt text
5. **Internal links** — at least 2 links to other site pages
6. **Status** — only `published` content appears in the sitemap
7. **Canonical** — do not change slug after indexing without planning a redirect

---

*Last updated: June 2026 — Phase 2 technical fixes implemented.*
