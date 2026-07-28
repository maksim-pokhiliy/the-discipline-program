/feature small mobile publishing: per-link publish status — "Never published" / "Last published: <date>" on every link, Publish emphasized until the first publish, tooltip mentions athletes

## How to run this

**Run the standard `/feature small` pipeline exactly as the skill prescribes** — investigation, plan, the plan-approval gate, implementation, review, verify, PR. Everything in this prompt is INPUT to that pipeline (evidence, ratified constraints, scope boundaries, acceptance) — it does not replace or skip any stage, gate, task tracking, or artifact of the skill. One heads-up for the plan-approval gate: present the plan and wait — the owner takes it for an external tech-lead review before answering the gate question.

Initiative context: this is `mobile-publish` **MP-22** (pick `mobile-publish` if the session-start hook asks). In the `post-uat` registry it is wave W2 / PU-08 — that initiative's D-1 routes execution here. SSOT: `initiatives/mobile-publish/deferred.md` entry MP-22 (owner spec 2026-07-16 + incident forensics). Out-of-scope discoveries go to `initiatives/mobile-publish/deferred.md` as notes, not into the diff.

## The problem (prod incident, 2026-07-16)

The coach created an INDIVIDUAL link for an athlete at 10:58:40 UTC, never pressed Publish, and asked the athlete to check the app 19 seconds later → the app was empty → half an hour of debugging. Verified: zero publish requests that day, zero `app_mobile_published_days` rows for the link, zero 4xx/5xx. The system behaved correctly — the UI lied: after creating a link the strip reads "Publishes to: <name>" in the present tense (reads as "already flowing"), there is no "linked but never published" state anywhere, no last-published date, and "Publish this week" reads as an optional extra rather than the mandatory step.

## Ratified spec (owner, 2026-07-16)

1. **Server/contract:** the links list response carries a per-link publish aggregate — publish count + last published timestamp — aggregated from the existing `app_mobile_published_days` table. Additive only.
2. **UI:** every link surfaces an honest per-link status — **"Never published"** (accented/attention-drawing, NOT gray-muted) or **"Last published: 11 Jul"**. The never-published state must be visible to the coach **without opening the Manage modal** — the incident happened because the strip itself looked done.
3. **Primary action:** while a link has zero publishes, "Publish this week" renders as THE primary action of the strip, not a peer of Manage. Note the current tree: the strip button is ALREADY `variant="contained"` vs Manage's `variant="text"` (`mobile-publishing-strip.tsx:145-164`) — so the hierarchy partially holds today; the gap to close is the zero-publish state being unmistakable. Verify what emphasis is actually missing and decide the concrete treatment in your plan.
4. **REV-I4 fold-in:** the disabled-Publish tooltip currently says "Link a training level first" (`mobile-publishing-strip.tsx:29`) — individual links exist now; it must mention both: "Link a training level or athlete first".

**Copy guard (owner, hold hard):** "Publish this week" sends ONLY the on-screen week. The status is therefore WEEK-scoped evidence — "Last published: 11 Jul" must not read as "the whole plan is sent". Write every label with that in mind.

## Tech-lead recon evidence (a head start — verify against the current tree, then use)

Server: `packages/api-server/src/endpoints/coaching/mobile-publish/links.ts:120-131` — `listLinks` is a plain `findMany` on `mobilePublishLink`, no aggregate. Source of truth for the status: `MobilePublishedDay` (`@@map("app_mobile_published_days")`, `schema.prisma:176-190`) — `linkId` FK + `publishedAt`, `@@unique([linkId, scheduledDate])`, `onDelete: Cascade` off the link. No migration needed — the data is already written on every publish.

Contract: `packages/contracts/src/entities/coaching/mobile-link/mobile-link.schema.ts` — `baseMobileLinkSchema` (id/planId/createdAt/updatedAt) extended by the GENERAL/INDIVIDUAL discriminated union; the additive fields belong on the base. Mapper: `packages/api-server/src/mappers/coaching/mobile-link.mapper.ts` (`mapToMobileLink`, takes a bare Prisma row today — its input widens). Route: `apps/platform/src/app/api/platform/mobile/links/route.ts` (GET). Client hook: `useMobileLinks` in `apps/platform/src/lib/hooks/use-mobile-publish.ts` — the type flows from the contract.

UI surfaces: the strip (`apps/platform/src/modules/plan-detail/components/mobile-publishing-strip.tsx` — `describeLinks` builds the "Publishes to: …" summary at :83); the Manage modal rows — GENERAL rows render a bare level label (`manage-mobile-links-modal.tsx:167-186`), INDIVIDUAL rows render a `UserChip` with a "Mobile: <name> · @<username>" secondary (`individual-link-row.tsx:118-126`).

Date formatting: `publishedAt` is a real event timestamp (NOT `@db.Date`) — use the house device-local formatter from `@repo/shared` (`formatCalendarDate` is reserved for calendar-date columns).

Freshness: after a successful publish the strip/modal status must reflect the new state without a page reload — check that the publish mutation's invalidation reaches the links query.

## Scope boundaries (ratified — not negotiable within this batch)

- Contract change ADDITIVE ONLY and exactly ONE: the per-link publish aggregate on the mobile-link response. Existing consumers must be unaffected.
- **ZERO diff under `packages/api-server/src/endpoints/coaching/mobile-publish/projection/`** — published legacy text stays byte-identical (D-17); verify with the projection suite.
- No Prisma migration. No new legacy API calls — the status must not depend on live legacy reads.
- Auth untouched: the links route stays coach-gated exactly as it is.
- House UI rules: MUI, palette tokens only (no hex), one component per file, no code comments, MUI floating labels where labels apply.
- Tests: platform runs via the root vitest runner with a project filter (apps/platform has no own `test` script); api-server touched files in isolation; the full serial api-server suite only at your discretion (standing approval; ~10 min serial, live Neon dev).
- ONE branch; suggested slug: `feat/mobile-publish-link-status`. PR against `main` (`main` is PR-only, squash merges).

## Acceptance (owner verifies on prod after merge)

- A freshly created link shows an accented "Never published" — and the coach can see that state without opening Manage; "Publish this week" is unmistakably the primary next step.
- After a publish, the link shows "Last published: <date>" (and the state updates right after publishing, no reload).
- The disabled-Publish tooltip reads "Link a training level or athlete first".
- No label anywhere implies the whole plan was sent — week-scoped wording throughout.
- Projection suite green (published bytes untouched); check-types / lint / dep:check green; touched tests green.
