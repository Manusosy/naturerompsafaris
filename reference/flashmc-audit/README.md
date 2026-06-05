# FlashMC Reference Audit

Audit date: 2026-06-03

This directory is the clean planning home for the Nature Romp Safaris redesign pass inspired by the current FlashMC public site.

## Evidence

- Header/default screenshot: `screenshots/01-home-header-default.png`
- Top-level dropdown screenshots: `screenshots/02-nav-hover-about-us.png` through `screenshots/09-nav-hover-contact-us.png`
- Nested destination loading screenshots: `screenshots/12-nested-destinations-uganda-instant.png` and `screenshots/13-nested-destinations-uganda-settled.png`
- Page-template screenshots: `screenshots/21-section-*.png`
- Detail-template screenshots: `screenshots/30-detail-*.png`
- Extracted menu tree: `menu-tree.json`
- Dropdown analysis: `nav-hover-analysis.json`, `nested-hover-analysis.json`, `destination-accommodation-nested-analysis.json`
- Page analysis: `page-template-analysis.json`, `detail-template-analysis.json`
- Second-pass typography/layout measurements: `second-pass-typography-layout.json`
- Current Nature Romp homepage comparison: `current-site/current-home-top.png`, `current-site/current-home-map-section.png`, `current-site/current-homepage-analysis.json`

## Plan Files

Read these in order before implementation:

1. `plans/00-master-redesign-plan.md`
2. `plans/01-header-navigation-plan.md`
3. `plans/02-homepage-plan.md`
4. `plans/03-country-destination-pages-plan.md`
5. `plans/04-safari-listing-pages-plan.md`
6. `plans/05-trip-detail-pages-plan.md`
7. `plans/06-accommodation-listing-pages-plan.md`
8. `plans/07-accommodation-detail-pages-plan.md`
9. `plans/08-builder-rules-and-qa.md`

Do not copy FlashMC logos, text, or image assets. Mirror the structure, spacing, interaction model, and information architecture using Nature Romp Safaris branding, content, images, and CMS data.

Second-pass note: the current Nature Romp East Africa map section is a good foundation and should be preserved conceptually. The header, global scale, and section typography need to move closer to the FlashMC reference.
