# Trip Detail Pages Prompt Plan

> Agent prompt: Build individual trip pages using the FlashMC trip-detail structure: image-first trip detail, sticky/dark tabs, content gallery, itinerary sections, price/seasons, inclusions, and a strong enquiry sidebar.

## Source References

- Kenya sample: `https://flashmctours.com/tour/birds-paradise-kenya-safari/`
- Tanzania sample: `https://flashmctours.com/tour/7-day-great-serengeti-migration-safari/`
- Screenshots: `../screenshots/30-detail-trip-detail-tanzania-serengeti-migration-00000.png`, `../screenshots/30-detail-trip-detail-tanzania-serengeti-migration-00900.png`

## Page Anatomy

1. Header/nav.
2. Large whitespace and full-width hero image band. FlashMC detail pages have a notable white gap between header/nav and the image band; keep this if it feels intentional in the final layout.
3. Dark horizontal tab bar:
   - Description
   - Itinerary
   - Price & Seasons
   - What's Included?
4. Two-column detail layout:
   - main content column;
   - right CTA/sidebar column.
5. Image gallery:
   - large primary image;
   - thumbnail strip below.
6. Description copy.
7. Tour highlights panel.
8. "Where you'll go" destination list/map.
9. Day-by-day itinerary.
10. Accommodation per day, when available.
11. Price and seasons table.
12. Included/excluded section.
13. Related tours and final enquiry CTA.

## Sidebar Anatomy

Right sidebar should include:

- Days count.
- Price from field.
- Strong gold "Reserve Online" or "Enquire Now" button.
- Secondary buttons: "Help me choose", "Ask a question".
- Phone fallback line.
- "Why book with Nature Romp Safaris?" proof box:
  - reviews;
  - customizable tours;
  - local expert service;
  - secure booking/support.
- Sustainability/carbon or responsible travel badge only if Nature Romp can support the claim.
- Sidebar boxes are compact and bordered, not large decorative cards.
- Primary action is a gold filled button; secondary actions are small outlined/text buttons.

Reference:

- `../screenshots/30-detail-trip-detail-tanzania-serengeti-migration-00900.png`

## Interaction Requirements

- Tabs scroll to sections and reflect active section.
- Tab bar uses dark background, white uppercase labels, and visible separators. It should stick below the main nav when scrolling if feasible.
- Gallery thumbnails update main image without changing page layout.
- Itinerary accordions are allowed on mobile; desktop can show expanded day blocks.
- Sidebar becomes non-sticky or stacks on mobile.
- CTAs open the existing enquiry flow or link to contact/book page.

## Content Requirements

- Do not invent prices, durations, inclusions, or sustainability claims.
- Use CMS trip fields first.
- If a field is missing, hide the related block rather than showing placeholder copy.
- Preserve strong H1 per trip.
- Add structured data for Tour/Product/FAQ where appropriate.
