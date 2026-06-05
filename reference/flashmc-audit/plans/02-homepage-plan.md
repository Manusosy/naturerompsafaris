# Homepage Prompt Plan

> Agent prompt: Rebuild the homepage as a usable safari homepage inspired by the FlashMC layout: immersive hero, editorial intro, destination discovery, tour highlights, proof sections, and clear planning CTAs.

## Hero

- Full-width image or video-like hero using authentic safari imagery.
- Dark green/black overlay so white text remains legible.
- Centered headline in a large serif font for closest FlashMC parity. If keeping Nature Romp's current left-aligned hero, the type must still use the FlashMC scale and visual drama.
- Desktop hero H1 should target about `80px / 80px`, Playfair Display, bold. Current Nature Romp hero is closer to `56px`; increase it for the redesign.
- Include one gold-highlighted word or phrase, similar to FlashMC using gold for "WILD."
- Small gold uppercase review/credibility line above headline.
- Supporting copy below headline in white.
- Add proof marks near lower hero: Google reviews and Tripadvisor award/rating badges if Nature Romp has equivalent proof. If not, use verified Nature Romp testimonial/rating data only.
- Avoid split hero cards and decorative SVG hero art.

Reference:

- `../screenshots/21-section-home-00000.png`

## Editorial Intro

- White background.
- Centered large serif heading: "All-inclusive Safari Holidays..." style, rewritten for Nature Romp.
- Desktop H2 target: about `52px / 62px`, Playfair Display, weight 400.
- Gold underline accent below heading.
- Two-column content row:
  - left: large readable paragraph and secondary serif question/subheading;
  - right: large real travel image.
- Keep generous spacing and avoid enclosing the whole section in a card.

Reference:

- `../screenshots/21-section-home-00900.png`

## Destination / Experience Discovery

- Use real destination blocks for Kenya and Tanzania first.
- If Zanzibar or combined Kenya-Tanzania exists, add them as secondary discovery tiles.
- Cards/tiles should be image-led and readable, not icon-only.
- Use restrained gold labels and green hover states.
- CTA text should be direct: View Kenya Safaris, View Tanzania Safaris, Plan My Safari.

## East Africa Map Section

- Preserve the current Nature Romp interactive map concept from `src/components/AfricaMap.tsx`.
- Keep the real GeoJSON country shapes for Kenya and Tanzania and the Zanzibar point marker.
- Keep tabbed focus for Kenya, Tanzania, and Zanzibar if Zanzibar content remains in the site.
- Keep hover-to-focus behavior on desktop and click/tap tabs for all devices.
- Tune visual style rather than deleting:
  - background can remain soft off-white/green-tinted;
  - heading should follow FlashMC editorial scale, around `52px` desktop if used as a major homepage section;
  - current map H2 around `42px` is acceptable only if the section is treated as secondary;
  - labels should remain readable and not overlap borders;
  - detail panel should be clean and uncarded or minimally framed.
- Do not replace this with a generic SVG illustration or stock map image.

Current baseline references:

- `../current-site/current-home-map-section.png`
- `../current-site/current-homepage-analysis.json`

## Featured Tours

- Reuse the tour card anatomy from the safari listing plan:
  - image top;
  - green duration badge;
  - gold country/category ribbon;
  - title in green serif;
  - tags;
  - excerpt;
  - outlined View Tour button.
- Show 4 to 6 cards, not an overloaded carousel.
- Include filters or segmented chips only if they work.

## Trust And Planning CTA

- Include a callback/request panel, but do not bury the primary CTA.
- Use proof items similar to the trip detail sidebar:
  - review count;
  - customizable safaris;
  - local experts;
  - secure booking/support.
- Include a compact enquiry form link or modal trigger.

## Homepage QA

- Header dropdowns must work over the hero without clipping.
- Hero text must not collide with proof badges at 360px, 768px, 1280px, and 1440px.
- The first viewport must clearly signal Nature Romp Safaris, not just generic Africa travel.
- Map labels, tabs, and country fills must be visible at desktop, tablet, and mobile sizes.
- Cookie banners or popups must not be used as design references.
