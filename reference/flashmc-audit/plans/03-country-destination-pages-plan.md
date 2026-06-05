# Country Destination Pages Prompt Plan

> Agent prompt: Build Kenya and Tanzania destination pages as detailed travel-guide hubs, not simple destination cards. Mirror the FlashMC country-page structure while using Nature Romp content.

## Source References

- Kenya: `https://flashmctours.com/destination/kenya/`
- Tanzania: `https://flashmctours.com/destination/tanzania/`
- Screenshots: `../screenshots/21-section-destination-kenya-00000.png`, `../screenshots/21-section-destination-kenya-00900.png`

## Page Anatomy

1. Header and nav.
2. Country hero with H1:
   - Kenya example pattern: "Kenya Safari Tours: Your Complete Guide to Kenya"
   - Tanzania example pattern: "Tanzania Safari Tours: Explore Serengeti Ngorongoro & Beyond"
3. "Explore [Country]" section:
   - centered serif heading;
   - gold underline;
   - stacked guide panels.
4. Guide panels:
   - "Where to Go in [Country]"
   - "When to Visit [Country]"
   - "[Country] Tours & Safaris"
   - "[Country] Safari Accommodation"
   - each has short paragraph, learn-more link, and large image.
5. About country editorial content:
   - why tourists visit;
   - wildlife highlights;
   - culture/landscape highlights;
   - travel planning notes.
6. Related trips and accommodation links.
7. FAQ and final CTA.

## Visual Rules

- Country pages are mostly white and editorial.
- Large serif headings with gold underline.
- Desktop country hero H1 target: about `62px / 74px`, Playfair Display, weight 700, white over image.
- "Explore [Country]" H2 target: about `52px / 62px`, Playfair Display, weight 400.
- Guide panel H3 target: about `24px / 24px`.
- Content panels use thin borders and subtle radius, not heavy cards.
- Images are large and horizontal.
- Body text should be comfortable and long-form.
- Use green links and gold accents sparingly.
- Guide panels in the FlashMC reference use a thin bordered box, text at top, green learn-more link, and a large wide image below. Preserve that order.

## Kenya-Specific Content Slots

- Where to go: Masai Mara, Amboseli, Samburu, Lake Nakuru, Tsavo, Mount Kenya, Diani if offered.
- When to go: dry season, migration season, green season.
- Tours: Kenya lodge safaris, budget/private safaris, fly-in safaris, migration safaris, Mount Kenya climbing if offered.
- Accommodation: Kenya safari lodges and camps grouped by park/region.

## Tanzania-Specific Content Slots

- Where to go: Serengeti, Ngorongoro, Tarangire, Lake Manyara, Zanzibar add-on if offered.
- When to go: migration windows, dry season, calving season.
- Tours: Tanzania lodge safaris, camping safaris, Kilimanjaro routes, Zanzibar beach extensions if offered.
- Accommodation: Tanzania lodges and camps grouped by park/region.

## Acceptance Criteria

- Kenya and Tanzania pages share the same template but have country-specific content and imagery.
- The quick guide panels link to the corresponding listing pages.
- The page is not card-heavy; it reads like a travel guide.
- SEO metadata and structured page headings are unique per country.
