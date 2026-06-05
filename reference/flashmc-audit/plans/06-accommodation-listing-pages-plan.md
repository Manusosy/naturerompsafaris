# Accommodation Listing Pages Prompt Plan

> Agent prompt: Build Kenya and Tanzania accommodation listing pages using the FlashMC lodge-listing structure: country intro, park/region discovery, filter rail, and image-led lodge cards.

## Source References

- Kenya lodges: `https://flashmctours.com/destination/kenya/kenya-safari-lodges/`
- Tanzania lodges: `https://flashmctours.com/destination/tanzania/tanzania-safari-lodges/`
- Screenshot: `../screenshots/21-section-kenya-lodges-list-03600.png`

## Page Anatomy

1. Header/nav.
2. Country accommodation hero with H1:
   - "Kenya Safari Lodges"
   - "Tanzania Safari Lodges"
3. Intro heading:
   - "Unforgettable Stays in [Country]'s Wilderness" style, rewritten.
4. Park/region quick links:
   - Kenya: Masai Mara, Amboseli, Lake Nakuru, Tsavo, Samburu, Nairobi, etc. only if content exists.
   - Tanzania: Serengeti, Ngorongoro, Tarangire, Lake Manyara, etc.
5. Main accommodation listing section.
6. Left filter rail.
7. Two-column lodge cards.
8. Related safari tours section.

## Filter Rail

- Groups:
  - National Park / Conservancy;
  - Comfort Level;
  - Accommodation Type;
  - Amenities if useful.
- Checkbox rows with counts.
- Group headings are serif/bold.
- Use light grey dividers.
- On mobile, collapse filters into a drawer or accordion above cards.

## Lodge Card Anatomy

Each lodge card must include:

- Large image area.
- Some FlashMC lodge cards use stacked/collage-like image blocks; a single strong image is acceptable, but preserve the image-led feeling and large visual area.
- Gold location ribbon on the image.
- Lodge title.
- Short excerpt.
- Comfort level/accommodation type if available.
- Outlined gold "View details" button.
- Stable image aspect ratio.
- No oversized rounded corners.
- Lodge cards should visually differ from tour cards: no duration badge, no route map preview, and no tour price emphasis.

## Data Rules

- Lodges must be related to country and park/region.
- Listing filters must be generated from actual lodge data.
- Empty filter states must be graceful.
- If there are fewer than 4 lodges in a country, show all and hide advanced filters.

## Acceptance Criteria

- Kenya and Tanzania accommodation pages share a template.
- Cards visually differ from tour cards.
- Filters remain usable and do not cover content.
- "View details" links to the accommodation detail route.
- The listing intro should include park/region quick links before filters/cards, matching the FlashMC country lodge flow.
