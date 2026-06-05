# Header And Navigation Prompt Plan

> Agent prompt: Rebuild the Nature Romp public header and navigation to match the FlashMC structure and interaction model. Prioritize desktop parity first, then produce a mobile menu that preserves the same hierarchy without desktop hover dependence.

## Desktop Header Anatomy

- Top utility row:
  - dark charcoal background;
  - left logo block using a light/white logo variant if available;
  - centered review/rating strip with Tripadvisor/Google-style proof, numeric rating, green rating dots, review count;
  - right phone and email with small icons;
  - far-right outlined gold callback button.
- Main nav row:
  - same dark charcoal background;
  - nav items centered with even spacing;
  - uppercase white labels;
  - small chevron for dropdown-capable items;
  - active hover item turns gold and gets a gold underline across the item width;
  - chevron points upward while open.
- Header measured reference:
  - full top header area is about `207px` tall at 1440px desktop;
  - top utility/logo row is about `132px` tall;
  - main nav row is about `74px` tall;
  - nav labels use Open Sans around `16px / 26px`, uppercase;
  - callback button uses gold border/text, roughly `178px x 41px`;
  - while scrolled, keep the dark nav row sticky and let the taller utility row disappear.

Current Nature Romp mismatch to fix:

- Current header has a brown topbar, white nav background, dark text, and a brown quote button. Replace this with the dark two-row FlashMC-style header.
- Current dropdowns are one-level, wide, and border-top brown. Replace with the simple/mega/dynamic variants below.
- Keep Nature Romp logo and contact details, but prepare a light logo treatment for the dark header.

Reference screenshots:

- `../screenshots/01-home-header-default.png`
- `../screenshots/06-nav-hover-accommodation.png`
- `../screenshots/07-nav-hover-national-parks.png`

## Top-Level Menu Structure

Use this order unless Nature Romp business requirements explicitly differ:

1. About Us
2. Destinations
3. Safari Tours
4. Experiences
5. Accommodation
6. National Parks
7. Blog
8. Contact Us

If Book Now is required in the nav, keep it as the utility-row CTA or a final highlighted action, not a normal dropdown item.

## Simple Dropdown Pattern

Used by About Us, Destinations, Safari Tours, Accommodation.

- White rectangular dropdown panel.
- Small white triangle pointer centered under the active top item.
- No rounded-card look beyond a very subtle radius.
- Width around 170px for compact menus.
- Links are grey text on white, around `15px / 18px`.
- Simple rows are about `34px` high; wrapped Safari Tours rows can be about `52px`.
- Row hover:
  - green background;
  - white text;
  - keep the row height stable.
- The dropdown begins directly below the nav bar with a small offset.
- Add subtle shadow only enough to separate from hero imagery.

Simple dropdown content:

- About Us: Safari Guides, Safari Vehicles, Sustainability or Nature Romp equivalents.
- Destinations: Kenya, Tanzania, Zanzibar/East Africa only if offered.
- Safari Tours: Kenya Tours & Safaris, Tanzania Tours & Safaris, Kenya Tanzania Tours & Safaris, and any current Nature Romp safari categories.
- Accommodation: Kenya, Tanzania.

References:

- `../screenshots/02-nav-hover-about-us.png`
- `../screenshots/03-nav-hover-destinations.png`
- `../screenshots/04-nav-hover-safari-tours.png`
- `../screenshots/06-nav-hover-accommodation.png`

## Mega Dropdown Pattern

Used by Experiences and National Parks.

- White panel with the same triangle pointer.
- Panel is wider than simple dropdowns.
- Category headings are uppercase, grey, bold, and compact.
- Child links are grey, left aligned, and stacked with tight vertical rhythm.
- No images inside the dropdown.
- No card backgrounds inside the dropdown.
- Mega dropdown rows use about `26px` vertical rhythm; do not pad them like cards.

Experiences reference:

- Two-column panel.
- Left heading: Top Experiences.
- Right heading: Wildlife Safari.
- Links sit below each heading.
- Mountain Climbing and Gorilla Trekking can expose third-level options if needed, but do not make the entire panel visually noisy.

National Parks reference:

- Wide panel.
- Kenya list in the left column.
- Tanzania and Uganda/other country list stacked in the right column.
- For Nature Romp, use Kenya and Tanzania only unless Uganda/Rwanda content is real.

References:

- `../screenshots/05-nav-hover-experiences.png`
- `../screenshots/07-nav-hover-national-parks.png`

## Dynamic Destination Submenu Loading

FlashMC has a dynamic country branch behavior under Destinations. The observed behavior:

- Hovering a country can create a large white child panel to the right.
- First frame shows a blank/empty white loading block.
- During loading, the country row may become pale green.
- Settled state replaces the blank block with trip rows.
- Active country row becomes solid green with white text.
- Loaded rows are table-like:
  - trip title on the left;
  - day count in the middle;
  - price-from text on the right;
  - thin separators between rows.
- The child panel is much wider than the country list and starts immediately to the right of the active country row.
- The loading panel is visibly blank/white before rows hydrate, not a spinner overlay.

Nature Romp implementation requirement:

- Do not block the entire menu while loading child trips.
- Render a white child panel immediately with 6 to 8 stable skeleton rows or a blank shimmer block.
- Replace with up to 8 top trips for that country.
- Keep row height fixed to prevent layout jump.
- Cache results per country after first hover.
- If no dynamic children exist, keep the country as a terminal link and do not show an empty flyout.
- Loaded trip preview rows should include only concise data: `title`, `duration`, `priceFrom`. Avoid descriptions, thumbnails, or badges inside the flyout.

References:

- Loading: `../screenshots/12-nested-destinations-uganda-instant.png`
- Settled: `../screenshots/13-nested-destinations-uganda-settled.png`

## Mobile Navigation

- Use a dark full-screen or drawer menu.
- Top-level items appear as accordion rows.
- Dropdown chevrons become expand/collapse controls.
- Dynamic country trip previews should be limited to 3 rows on mobile with a "View all" link.
- Utility contact information and callback CTA remain visible at the bottom of the drawer.
- No hover-only behavior on touch devices.

## Acceptance Criteria

- Desktop top nav hover states match screenshots.
- Simple dropdown, mega dropdown, and dynamic child panel are separate component variants.
- Menus do not overlap header text incoherently at 1280px, 1440px, and common laptop widths.
- Keyboard users can tab through top-level items and open dropdowns.
- Dynamic submenu loading has a visible stable loading state and no content jump.
