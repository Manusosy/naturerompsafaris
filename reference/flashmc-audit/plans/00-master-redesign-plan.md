# Nature Romp FlashMC-Inspired Redesign Master Plan

> Agent prompt: Build a production-quality Nature Romp Safaris website that mirrors the observed FlashMC layout systems, navigation behavior, page hierarchy, and card/detail patterns, while using Nature Romp branding, content, routes, CMS data, and assets. Do not copy FlashMC protected text, logos, or photos.

## Source Pages Audited

- FlashMC homepage: `https://flashmctours.com/`
- Kenya destination: `https://flashmctours.com/destination/kenya/`
- Tanzania destination: `https://flashmctours.com/destination/tanzania/`
- Kenya safari listing: `https://flashmctours.com/destination/kenya/kenya-safaris/`
- Tanzania safari listing: `https://flashmctours.com/destination/tanzania/tanzania-safaris/`
- Kenya accommodation listing: `https://flashmctours.com/destination/kenya/kenya-safari-lodges/`
- Tanzania accommodation listing: `https://flashmctours.com/destination/tanzania/tanzania-safari-lodges/`
- Kenya trip detail: `https://flashmctours.com/tour/birds-paradise-kenya-safari/`
- Tanzania trip detail: `https://flashmctours.com/tour/7-day-great-serengeti-migration-safari/`
- Kenya accommodation detail: `https://flashmctours.com/accommodations/fairmont-mara-safari-club/`
- Tanzania accommodation detail: `https://flashmctours.com/accommodations/acacia-seronera-luxury-camp/`

## Global Visual Direction

- Use a dark charcoal global header with white uppercase navigation and gold active states.
- Use a refined safari editorial style: large serif headings, restrained sans-serif body copy, generous white space, real photography, and green/gold utility accents.
- Use the same font family direction as FlashMC and the current Nature Romp implementation:
  - Headings: `Playfair Display`, fallback `Georgia`, serif.
  - Body/nav/forms: `Open Sans`, fallback `Arial`, sans-serif.
  - Dropdown item fallback can remain Open Sans; do not introduce a third display font.
- Desktop type scale must be closer to FlashMC than the current homepage:
  - homepage hero H1 target: about `80px` line-height `80px` on wide desktop, with responsive clamp down on mobile;
  - inner page H1 target: about `62px` line-height `74px`;
  - editorial section H2 target: about `52px` line-height `62px`, weight 400;
  - compact section H3 target: about `24px` to `32px`;
  - body copy target: `15px` to `18px`, with comfortable `1.6` to `1.75` line-height depending on section density;
  - nav labels target: `16px`, uppercase, normal to medium weight.
- Avoid decorative blobs, one-note gradients, oversized marketing cards, and generic SaaS styling.
- Build pages as real travel experiences first, not landing-page explainers.
- Preserve dense, scannable travel data where it matters: trip days, prices, destinations, comfort level, lodge location, amenities, room types, filters, and CTA panels.

## Global Page Shell

- Header appears on every public page.
- Desktop header has two rows:
  - top utility strip with logo, review/rating signal, phone/email, and outlined callback button;
  - dark navigation strip with top-level menu items.
- FlashMC behavior to preserve: at the top of the page the full utility row plus nav is visible; while scrolling, the main dark nav row can remain sticky while the taller utility row scrolls away.
- Homepage hero differs from inner pages:
  - homepage uses full-viewport image/video-like hero with overlaid headline, gold accent word, Google/Tripadvisor proof marks;
  - inner pages use a simpler header/hero sequence, usually a large image banner or editorial hero followed by content.
- Footer should be content-rich with quick links, country links, accommodation links, policy links, and contact details.

## Current Nature Romp Comparison

- Current implementation already loads `Open Sans` and `Playfair Display`; preserve these font variables and tune sizes/weights rather than replacing the font system.
- Current homepage header is white/brown and does not match the FlashMC dark two-row reference. Redesign it according to `01-header-navigation-plan.md`.
- Current hero has good image-overlay direction but is left-aligned and smaller than FlashMC. Either center it for closer parity or intentionally keep left alignment only if the final design still captures FlashMC's large editorial scale and review/proof composition.
- Current East Africa map section is worth keeping. It uses real GeoJSON shapes, tabs, labels, and a detail panel. Do not remove it during the redesign; tune its typography, spacing, and colors to the global style.
- Current tour cards already contain some useful trip data, but the listing plan requires the more specific FlashMC card anatomy with duration badge, gold image ribbon, tags, route/map preview, price label, and outlined action.

## Required Route Groups

- Home
- About Us
- Destinations: Kenya, Tanzania, optional Zanzibar or East Africa if Nature Romp offers them.
- Safari Tours: Kenya safaris, Tanzania safaris, Kenya and Tanzania combined safaris, category filters.
- Experiences: migration, family, honeymoon, luxury, fly-in, budget/private, mountain climbing, beach add-ons if content exists.
- Accommodation: Kenya safari lodges, Tanzania safari lodges.
- National Parks: Kenya and Tanzania parks if Nature Romp content exists.
- Blog
- Contact
- Book Now / Request Callback

## CMS/Data Requirements

- Navigation must be data-driven enough to render:
  - simple dropdowns,
  - mega dropdowns,
  - nested dynamic destination trip previews with loading state,
  - accommodation country entries,
  - national park grouped columns.
- Trips need fields for title, slug, country/countries, duration, price from, destination tags, short excerpt, image, map preview or route data, highlights, itinerary days, inclusions, price seasons, gallery, and enquiry CTA data.
- Accommodations need fields for name, slug, country, park/region, accommodation type, comfort level, eco rating, amenities, hero, gallery, room types, associated trips, related lodges, and enquiry CTA data.
- Country destination pages need country hero, intro, quick guide cards, section images, park links, tour links, accommodation links, travel guide content, FAQ, and SEO.

## Screenshot Reference Map

- Header and nav: `../screenshots/01-home-header-default.png`, `../screenshots/03-nav-hover-destinations.png`, `../screenshots/05-nav-hover-experiences.png`, `../screenshots/07-nav-hover-national-parks.png`
- Typography/layout measurements: `../second-pass-typography-layout.json`
- Current map baseline: `../current-site/current-home-map-section.png`
- Dynamic submenu loading: `../screenshots/12-nested-destinations-uganda-instant.png`, `../screenshots/13-nested-destinations-uganda-settled.png`
- Homepage sections: `../screenshots/21-section-home-00000.png`, `../screenshots/21-section-home-00900.png`, `../screenshots/21-section-home-01800.png`
- Country pages: `../screenshots/21-section-destination-kenya-00000.png`, `../screenshots/21-section-destination-kenya-00900.png`
- Tour listings: `../screenshots/21-section-kenya-safaris-list-01800.png`, `../screenshots/21-section-kenya-safaris-list-03600.png`
- Trip details: `../screenshots/30-detail-trip-detail-tanzania-serengeti-migration-00000.png`, `../screenshots/30-detail-trip-detail-tanzania-serengeti-migration-00900.png`
- Accommodation listings: `../screenshots/21-section-kenya-lodges-list-03600.png`
- Accommodation details: `../screenshots/30-detail-lodge-detail-kenya-fairmont-mara-00000.png`, `../screenshots/30-detail-lodge-detail-kenya-fairmont-mara-00900.png`

## Implementation Phases

1. Header and navigation first. This is the main failing surface and must be completed before page polish.
2. Shared card systems: tour cards, lodge cards, filter rail, CTA sidebar, tab bar.
3. Listing pages for safaris and accommodations.
4. Detail pages for trips and accommodations.
5. Country destination pages.
6. Homepage final pass.
7. Responsive and interaction QA.
