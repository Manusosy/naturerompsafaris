# Safari Listing Pages Prompt Plan

> Agent prompt: Build Kenya, Tanzania, and combined safari listing pages using the FlashMC listing pattern: hero, category feature blocks, editorial intro, filters, and tall tour cards.

## Source References

- Kenya listing: `https://flashmctours.com/destination/kenya/kenya-safaris/`
- Tanzania listing: `https://flashmctours.com/destination/tanzania/tanzania-safaris/`
- Screenshots: `../screenshots/21-section-kenya-safaris-list-01800.png`, `../screenshots/21-section-kenya-safaris-list-03600.png`

## Page Sections

1. Header/nav.
2. Page hero with country listing H1.
3. Intro section:
   - H2: "We have many exciting and unique [country] safari tours for you" style, rewritten.
   - Four feature category tiles/cards.
   - Image strip or supporting gallery.
4. Main listing introduction:
   - centered serif H2: "Safari Tours in Kenya" or "Tanzania Tours & Safaris";
   - gold underline;
   - short centered paragraph.
5. Filter and card grid:
   - left filter rail on desktop;
   - two-column tour card grid on desktop;
   - filters above cards or accordion on mobile.

## Filter Rail

- White/very light background.
- Heading "Filters".
- Collapsible groups with checkboxes:
  - Destination/park;
  - Duration;
  - Experience;
  - Comfort/budget level if data exists.
- Counts appear right aligned in light grey.
- Slider for price or duration only if it actually filters.
- On desktop, the filter rail sits to the left of a two-column card grid and should remain visually calm, with thin dividers and right-aligned counts.
- Do not make filters into colorful cards.

## Tour Card Anatomy

Each tour card must include:

- Large image area.
- Green duration badge top-right.
- Gold translucent country/category ribbon at image bottom-left.
- Small monochrome experience icons at image bottom-right if content supports them.
- Title in green serif.
- Small destination tags.
- Excerpt, trimmed consistently.
- Faint route/map preview if route data exists.
- "Price From" label near lower right.
- Outlined gold "View Tour" button.
- Card grid should feel tall and editorial, not compact ecommerce tiles.
- The image area may include a small icon strip on the lower-right; use existing lucide/custom category icons only if they are meaningful.

Reference:

- `../screenshots/21-section-kenya-safaris-list-03600.png`

## Listing Behavior

- Filtering should update cards without layout collapse.
- Loading state should use skeleton card blocks matching final dimensions.
- Empty state should suggest clearing filters and link to custom safari enquiry.
- Cards must stay equal enough in height for a clean two-column grid.

## Country Variants

- Kenya page categories: Masai Mara migration, fly-in safaris, honeymoon, Mount Kenya, private/lodge safaris.
- Tanzania page categories: Kilimanjaro, Serengeti, migration, Zanzibar, Ngorongoro/Tarangire.
- Combined page categories: Kenya and Tanzania lodge safari, budget safari, migration routes, beach extension.

## Feature Tile Detail

- FlashMC listing pages include a distinctive feature-tile band before the main card grid.
- Some feature headings appear vertically over narrow image panels on desktop.
- If vertical text is implemented, verify it is deliberate, readable, and responsive. On mobile convert to normal horizontal headings.
- Preserve the rhythm: hero, big H2, feature image tiles, supporting image strip, then the centered "Safari Tours in [Country]" intro before filters/cards.
