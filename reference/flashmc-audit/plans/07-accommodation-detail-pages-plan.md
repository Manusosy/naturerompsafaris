# Accommodation Detail Pages Prompt Plan

> Agent prompt: Build individual accommodation detail pages using the FlashMC accommodation-detail structure: full-width lodge hero, breadcrumb/title/rating block, attribute blocks, room types, related trips, related lodges, and enquiry CTA.

## Source References

- Kenya sample: `https://flashmctours.com/accommodations/fairmont-mara-safari-club/`
- Tanzania sample: `https://flashmctours.com/accommodations/acacia-seronera-luxury-camp/`
- Screenshots: `../screenshots/30-detail-lodge-detail-kenya-fairmont-mara-00000.png`, `../screenshots/30-detail-lodge-detail-kenya-fairmont-mara-00900.png`

## Page Anatomy

1. Header/nav.
2. Full-width lodge hero image.
3. Breadcrumb row:
   - Home | Accommodations | Lodge Name
4. Small "Welcome to" line.
5. Large centered H1.
6. Eco rating leaf icons, if data exists.
7. Attribute summary blocks:
   - Location;
   - Accommodation;
   - Comfort Level;
   - Amenities.
8. Main lodge description and gallery.
9. Room Types section.
10. Experience this lodge / trips that include this lodge.
11. Other lodges in this park/country.
12. Advantages/proof section.
13. Request callback/enquiry form.

## Visual Rules

- Hero image is full-width and image-first.
- Title block is centered on white.
- Accommodation detail H1 in the reference is smaller than trip/listing H1, around `36px / 40px` and uses Open Sans. Nature Romp may keep Playfair for consistency, but do not oversize the lodge title into a homepage-style hero H1.
- Attribute icons should use Nature Romp icon style, gold or green, not copied assets.
- Attribute blocks must be responsive and should not produce oversized color slabs unless intentionally designed and verified.
- Avoid the headless-reference blue slab artifact; the intended design is a clear attribute summary, not a huge empty colored block.
- Room type sections can use image cards or clean content rows.
- Related trips reuse tour cards in a compact form.
- Related lodges reuse lodge cards.

## Data Rules

- Location must come from park/region/country fields.
- Comfort level must be controlled vocabulary: economy, mid-range, luxury, ultra-luxury, or Nature Romp equivalents.
- Amenities must be real, not decorative.
- Eco rating only shows when the record has a rating.
- Related trips are fetched by lodge relation first, then by same park/country fallback.

## Acceptance Criteria

- Kenya and Tanzania lodge detail pages share the same template.
- Each page has a distinct hero, title, location, comfort level, amenities, and room types.
- CTA flow connects to the same enquiry system as trips.
- Mobile stacks hero, title, attribute blocks, and CTA cleanly.
