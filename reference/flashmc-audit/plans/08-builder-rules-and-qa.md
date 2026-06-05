# Builder Rules And QA

> Agent prompt: Follow these rules when implementing any plan in this directory. Do not start coding from memory. Read `AGENTS.md`, relevant Next docs, and the page-specific plan first.

## Non-Negotiable Rules

- Read `AGENTS.md` before editing.
- This repo uses a newer Next.js with changed conventions. Before editing Next routes, layouts, middleware/proxy, metadata, server actions, or app-router behavior, read the relevant guide in `node_modules/next/dist/docs/`.
- Do not delete or revert existing user changes.
- Do not copy FlashMC logos, photos, prose, forms, or proprietary claims.
- Use Nature Romp content, CMS data, routes, and brand assets.
- Build actual working pages and components, not mock landing sections.
- Keep header/nav implementation separate from page templates.
- Use existing project patterns and components where they are healthy.
- If existing components are too limiting, refactor narrowly and document the reason.

## Design QA

- Verify desktop at 1440px and 1280px.
- Verify tablet around 768px.
- Verify mobile at 390px and 360px.
- Verify the global type scale against `second-pass-typography-layout.json`:
  - Playfair Display headings;
  - Open Sans body/nav;
  - homepage hero larger than the current 56px implementation;
  - section H2s near the 52px FlashMC editorial scale on desktop where space allows.
- Check all dropdown variants:
  - simple dropdown;
  - mega dropdown;
  - dynamic destination child loading;
  - settled dynamic trip rows;
  - mobile accordion.
- Ensure text never overlaps buttons, cards, images, or following content.
- Ensure dropdowns are not clipped by parent containers.
- Ensure cards have stable heights and image aspect ratios.
- Confirm hover, keyboard focus, and touch behavior.
- Confirm sticky behavior: main dark nav remains usable on scroll; utility row does not consume screen height after scrolling.
- Confirm the current map concept is preserved unless the user explicitly asks to remove it.

## Functional QA

- Navigation links resolve to valid routes.
- Dynamic submenu loading caches country data after first hover.
- Filters update listings and can be cleared.
- Listing cards link to the correct detail pages.
- Detail CTAs open or route to the correct enquiry flow.
- Missing CMS fields hide optional blocks instead of showing placeholders.
- Run typecheck, lint, tests, and build before claiming completion.

## Content QA

- Headings must be unique and country/page specific.
- Prices, days, amenities, room types, and sustainability claims must come from data.
- Do not invent testimonials or review counts.
- Image alt text must be meaningful.
- SEO metadata should be generated from page data.

## Evidence QA

- Save screenshots of completed pages in a verification folder.
- Capture the same surfaces as this audit:
  - default header;
  - dropdown hovers;
  - dynamic submenu loading and settled state;
  - country destination pages;
  - safari listing pages;
  - trip detail pages;
  - accommodation listing pages;
  - accommodation detail pages.
  - current homepage map section after any homepage redesign changes.

## Second-Pass Evidence

- Use `reference/flashmc-audit/second-pass-typography-layout.json` for measured FlashMC font families, sizes, line heights, and header dimensions.
- Use `reference/flashmc-audit/current-site/current-home-map-section.png` as the baseline for the Nature Romp map section that should be preserved and refined.
