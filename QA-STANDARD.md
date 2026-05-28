# QA Standard for Admin -> Frontend E2E Delivery

## Goal
- Establish a strict quality standard to complete end-to-end integration between the admin side (`/admin`) and frontend pages.
- Prioritize destination flow first: creating/updating a destination in admin must reliably render correctly on `/destinations` and `/destinations/[slug]`.
- Ensure both data integrity and visual/design integrity (template consistency, spacing, typography, responsive behavior, and user interactions).

## Current Context (Observed Baseline)
- The custom portal destination module is defined in `src/lib/portal/modules.ts`.
- Destination schema for Payload is defined in `src/collections/Destinations.ts`.
- Frontend destination pages read published records from:
  - `src/app/(frontend)/destinations/page.tsx`
  - `src/app/(frontend)/destinations/[slug]/page.tsx`
- Portal save endpoint is `src/app/api/portal/records/route.ts`.
- Critical mismatch to resolve first:
  - Portal fields include `mapEmbedUrl`, `latitude`, `longitude`, `galleryImages`.
  - Destination collection currently defines `gallery` (not `galleryImages`) and does not yet expose map fields in the same structure.
  - Frontend destination detail page does not currently render map content.

## QA Principles
- Single source of truth: collection schema, portal module fields, and frontend rendering contract must match exactly.
- No hidden transformations: each admin field must have traceable serialization and expected frontend output.
- Publish-state correctness: only `published` destinations appear on public destination pages.
- Design parity: rendered page must follow existing destination template style and responsive behavior.
- Safe rollout: destination E2E is completed and stable before expanding to trips/packages/blog.

## Scope
### In scope (Phase 1)
- Destination create/edit flow in custom portal.
- Destination listing and detail rendering on frontend.
- Media/gallery behavior.
- Map data capture + map rendering behavior.
- SEO/meta fields for destination detail.

### Out of scope (Phase 1)
- Full redesign of portal shell.
- New content model for unrelated modules.
- Large visual rebrand outside destination templates.

## Definition of Done (Destination E2E)
- Admin can create a destination with all required fields and save successfully.
- Saved data persists in Payload with correct shape and no dropped fields.
- Published destination appears on `/destinations` with correct card data.
- Destination detail page renders:
  - hero image
  - summary/content
  - gallery images with valid alt fallback behavior
  - FAQs
  - map section (embed and/or coordinates fallback, per implemented design)
- SEO metadata resolves from destination SEO fields with fallback behavior.
- No console errors, runtime exceptions, or broken media links on key viewport sizes.

## Execution Plan

### Phase 0: Contract Alignment (Must be first)
- Align destination field contract across:
  - `src/lib/portal/modules.ts`
  - `src/components/portal/ResourceForm.tsx` transformation logic
  - `src/collections/Destinations.ts`
  - `src/app/(frontend)/destinations/[slug]/page.tsx`
- Decide final canonical names for:
  - gallery field (`gallery` vs `galleryImages`)
  - map fields (`mapEmbedUrl`, `latitude`, `longitude`)
  - SEO image field naming consistency (if used).
- Document final field contract in code comments or module-level docs.

### Phase 1: Destination Admin UX Rectification
- Reorder destination fields in portal to match editor workflow:
  - identity (`name`, `slug`, `status`, `country`, `region`)
  - core content (`summary`, `content`)
  - media (`hero`, gallery)
  - map/location
  - FAQs
  - SEO
- Confirm required-field behavior and inline validation messages.
- Ensure helper text is clear for map input format and gallery expectations.
- Verify slug normalization behavior remains deterministic.

### Phase 2: Destination Frontend Rendering Completion
- Confirm listing card consumes expected fields (name, summary, hero, country, slug).
- Implement/verify map section rendering on destination detail page:
  - render embed when `mapEmbedUrl` exists,
  - optionally show coordinates fallback if embed is absent,
  - hide section gracefully when no map data.
- Confirm gallery rendering respects the collection data shape and alt text behavior.
- Ensure content blocks render safely and match design system classes.

### Phase 3: End-to-End QA Pass (Manual + Automated)
- Run the full test matrix below.
- Fix data-shape bugs first, then visual bugs.
- Capture baseline screenshots for desktop/tablet/mobile.
- Sign off only when all acceptance criteria pass.

### Phase 4: Expand Pattern to Other Modules
- Apply same contract-first QA method to trips, packages, blog, navigation, and media-dependent pages.
- Reuse the same checklist and release gates.

## Test Matrix (Destination)

### A) Admin Save / Data Integrity
- Create destination with minimum required fields -> save succeeds.
- Create destination with full fields -> all values persist.
- Edit existing destination -> changed fields update only expected records.
- Set `status=draft` -> destination absent from public pages.
- Set `status=published` -> destination appears publicly.
- Invalid/missing required fields -> save blocked with clear errors.

### B) Data Contract Assertions
- API payload from portal uses agreed field names.
- Stored document in Payload includes expected map/gallery/faq/seo structures.
- No orphaned fields (example: value submitted but not stored due to naming mismatch).

### C) Frontend Functional
- `/destinations` shows all published destinations sorted as expected.
- `/destinations/[slug]` resolves and renders correct destination.
- Non-existent or draft-only slug returns not found behavior.
- Map block behavior:
  - embed present -> rendered
  - coordinates only -> fallback behavior rendered (if implemented)
  - no map data -> no broken UI
- Gallery and FAQs render with no layout break.

### D) Design and Template QA
- Verify destination detail layout against approved design sections.
- Check typography, spacing, card dimensions, image crop behavior, and CTA consistency.
- Responsive checks:
  - mobile (360-430px)
  - tablet (~768px)
  - desktop (>=1280px)
- Accessibility checks:
  - image alt text
  - heading hierarchy
  - keyboard focus visibility
  - sufficient color contrast for key text blocks

### E) Regression
- Confirm unrelated pages still work:
  - `/`
  - `/safari-packages`
  - `/blog`
  - `/contact`
- Confirm no breakage in portal module listing/editing for trips/packages/posts.

## Release Gates
- Gate 1 (Contract): schema, admin module, and frontend contract aligned and reviewed.
- Gate 2 (Functional): destination create/edit/publish E2E passes.
- Gate 3 (Visual): destination page design QA approved on 3 viewports.
- Gate 4 (Regression): smoke checks pass for high-traffic pages and portal core modules.

## Ownership and Workflow
- Product/Design:
  - approves destination template structure and map display behavior.
- Engineering:
  - implements contract alignment and rendering updates.
  - adds/updates tests and migration scripts if field names change.
- QA:
  - executes test matrix and records evidence (screenshots + notes).

## Evidence Required for Sign-off
- 1 successful full create/edit/publish destination walkthrough video or step log.
- Before/after screenshots for destination list + detail across target viewports.
- Payload record snapshot showing saved field structure.
- Brief regression checklist output for core pages.

## Immediate Next Steps (Actionable)
- Finalize destination field contract decision (`gallery` vs `galleryImages`; map field naming).
- Update schema/module/form mapping to match that contract.
- Add/confirm destination map render block in frontend detail template.
- Run full destination test matrix and fix defects.
- Mark destination E2E as baseline complete, then move to trips and packages using same QA standard.
