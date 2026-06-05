# Claude Rules For Nature Romp Safaris

Read `AGENTS.md` first. Its Next.js warning is mandatory: this project uses a newer Next.js with breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before editing routes, layouts, metadata, proxy/middleware, server actions, or app-router behavior.

For the FlashMC-inspired redesign work, read the planning docs in `reference/flashmc-audit/plans/` before writing code. Start with `00-master-redesign-plan.md`, then the page-specific file.

Do not copy FlashMC logos, photos, proprietary text, review claims, or brand assets. Mirror the structure, spacing, interaction model, and component anatomy using Nature Romp Safaris branding, real content, CMS data, and assets.

Use the established Nature Romp font direction: `Playfair Display` for headings and `Open Sans` for body, navigation, forms, and dense UI. The FlashMC measured scale is documented in `reference/flashmc-audit/second-pass-typography-layout.json`; use it to tune sizes instead of guessing.

Preserve existing user changes. Do not revert files or remove code unless the task explicitly requires it and you understand the current dirty worktree.

Header/navigation is the highest-priority surface. Implement and verify simple dropdowns, mega dropdowns, dynamic destination submenu loading, settled trip rows, keyboard access, and mobile accordion behavior before polishing page templates.

Preserve the current interactive East Africa map concept on the homepage unless the user explicitly asks to remove it. It should be refined to match the new typography and spacing, not replaced with a generic map.

For every frontend change, verify responsive behavior at desktop, tablet, and mobile widths. Text must not overlap, dropdowns must not clip, cards must keep stable dimensions, and CTAs must remain reachable.

Before claiming completion, run the relevant checks: typecheck, lint, tests, build, and browser screenshots for the changed pages.
