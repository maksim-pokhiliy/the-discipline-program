# mobile-publish — decisions

D-numbered ratified decisions. The SSOT for "why." Status: `RATIFIED` / `OPEN` / `SUPERSEDED`.

## Index

| ID   | Topic                                                                                 | Status   |
| ---- | ------------------------------------------------------------------------------------- | -------- |
| D-1  | Push-projection, not a rewrite; legacy backend + iOS app untouched                    | RATIFIED |
| D-2  | Connector model: per-coach legacy auth; store the token, never the password           | RATIFIED |
| D-3  | Link = channel + key (Level \| Athlete), persistent on the plan; General first        | RATIFIED |
| D-4  | Publish = idempotent upsert-emulation + overwrite-guard                               | RATIFIED |
| D-5  | Projection renders structured rows → legacy free text via `build-session-detail`      | RATIFIED |
| D-6  | Placement: connector in `coaching/mobile-publish/` + `infrastructure/legacy-mobile/`  | RATIFIED |
| D-7  | Token at rest: AES-256-GCM in api-server, env key, fail-closed                        | RATIFIED |
| D-8  | Projection seam: shared UI-free `renderRowLine` (true SSOT), NOT build-session-detail | RATIFIED |
| D-9  | `MobilePublishedDay` ledger + upsert-emulation decision logic + live-content skip     | RATIFIED |
| D-10 | Surface placement: inline LINK strip + PUBLISH-results modal + publish-all-linked     | RATIFIED |
| D-11 | Unlink IN scope; disconnect DEFERRED to P3 (cascade-blast-radius unresolved)          | RATIFIED |
| D-12 | Promote `MOBILE_RECONNECT_REQUIRED` to `@repo/contracts`; one wire-contract SSOT      | RATIFIED |
| D-13 | Projection syntax: schema-aware legacy assembler; reframe the D-8 SSOT altitude       | RATIFIED |

---

### D-1 — Push-projection, not a rewrite

- **Status:** RATIFIED (owner, 2026-06-25).
- **Decision.** The platform publishes plans INTO the legacy stack via its existing REST API; the legacy Spring backend and the iOS app are NOT modified. We are a pure ADMIN API client.
- **Rationale.** Owner: legacy lives on, the mobile dev is busy, no legacy changes planned → we cannot add endpoints there; a connector consuming the existing API is the only viable shape. Avoids an App-Store release + an account migration. Option 2 (repoint iOS at the platform API, retire the Java backend) is the eventual north star — ADR-0005/0020 anticipate a mobile consumer — but is a separate initiative (`deferred.md` MP-NORTH-STAR).
- **Links.** memory `project-domain-architecture` (apex = legacy Spring, don't touch); `legacy-contract.md`.

### D-2 — Connector model: per-coach legacy auth

- **Status:** RATIFIED (owner, 2026-06-25 — the "like Claude Connectors" framing).
- **Decision.** A coach connects the mobile app from his platform profile by logging in with his OWN legacy ADMIN credentials; the platform stores his legacy **token** (encrypted) + expiry + connected identity — NEVER the password. Connections are **per-coach** (the mobile app has several admins; each connects as himself), not one shared service account.
- **Rationale.** This makes the identity bridge an explicit, coach-driven act, dissolving the "are the two user-bases the same people?" blocker (owner: "думаю те же, но не точно") — no email-matching, no migration. Verified: legacy JWT TTL = 1 month, no refresh endpoint → reconnect ~monthly (`deferred.md` MP-4). The token is sent as the `Authorization` header; signin returns `{userId, accessToken, userRole, userPlan}` so we can show "connected as X (ADMIN)".
- **Links.** `legacy-contract.md` (auth mechanics); `deferred.md` MP-4.

### D-3 — Link = channel + key; General channel first

- **Status:** RATIFIED (owner, 2026-06-25).
- **Decision.** A platform plan is linked to a legacy target = **{channel, key}**: General → a `training_level_id` (shared by everyone on the level); Individual → a legacy `user_id`. The link is persisted on the plan (not chosen ad-hoc per publish) so republish, "where is this published," and the overwrite-guard have a stable referent. Publish granularity (day/week) is orthogonal. **Sequence: General channel first (P1)** — its Level picker is a PUBLIC read, so it needs NO identity bridge — then Individual (P2).
- **Rationale.** Owner delivers BOTH ways (by level and by user), so both channels are required; the legacy side has exactly these two. The platform has no first-class "level" on a plan (level is a profile axis), so the General target is chosen at link time. General-first because it sidesteps the identity bridge and proves the full pipeline on the thinnest slice. The legacy "program" is not an object you select — it is a per-day stream under (channel, key); "link a plan to a program" really means "choose the channel + key."
- **Links.** `legacy-contract.md` (the two channels; the `GET /user?userPlanId=2` athlete picker); `deferred.md` MP-1.

### D-4 — Publish = idempotent upsert-emulation + overwrite-guard

- **Status:** RATIFIED (owner, 2026-06-25).
- **Decision.** Because the legacy POST is insert-only (throws `AlreadyExist` on an existing (key, date)), publish emulates upsert: GET the existing row by (level/user, date) → PUT if present, else POST. Before overwriting a row the platform did NOT author (e.g. one Denys typed directly in the iOS app), the publish UI MUST warn and require confirmation.
- **Rationale.** The legacy prod DB is inviolable (memory `prod-data-inviolable`); silently clobbering a coach-authored day is unacceptable. There is NO DB unique constraint on (key, date) → concurrency can still double-insert (`deferred.md` MP-8); publish serializes per (key, date) on our side.
- **Links.** `legacy-contract.md`; memory `prod-data-inviolable`; `deferred.md` MP-8.

### D-5 — Projection renders structured rows → legacy free text

- **Status:** RATIFIED (owner, 2026-06-25).
- **Decision.** The publish projection renders a Day's Sessions/Blocks/Schemas/Rows into the legacy `dailyProgram` shape (`dayTrainings[].blocks[].exercises[String]`) by reusing the platform's existing session read-model (`build-session-detail`), so published text matches what the platform shows. The legacy block `name` comes from the platform Block's Label(s); each Schema/Row renders to a text line. General-channel loads stay as "% 1RM / scheme" text; the Individual channel MAY bake the athlete's resolved weight (P2-optional, MP-2).
- **Rationale.** The projection is intentionally lossy (structured → text); the iOS app only displays text, so display fidelity holds while structured features stay platform-only. Reusing `build-session-detail` keeps ONE rendering SSOT (published text == platform display).
- **Links.** `packages/api-server/src/endpoints/lms/session-detail/build-session-detail.ts`; `deferred.md` MP-2, MP-5, MP-7. **Mechanism refined by D-8** (the literal `build-session-detail` reuse was replaced by a shared `renderRowLine` seam; D-5's _intent_ — published text == platform display — is preserved and now enforced by a parity test).

### D-6 — PLACEMENT: connector in coaching + infrastructure; no new context, no new rule

- **Status:** RATIFIED (P1a, 2026-06-25).
- **Decision.** All publish/connector endpoints, mappers, projection, and the publish service live under `packages/api-server/src/endpoints/coaching/mobile-publish/` (+ `mappers/coaching/`); the legacy REST client is an infrastructure port at `packages/api-server/src/infrastructure/legacy-mobile/`; contracts under `packages/contracts/src/entities/coaching/{mobile-connection,mobile-link,mobile-publish,legacy-mobile}/`.
- **Rationale.** `docs/BOUNDED-CONTEXTS.md` §9 sanctions `Coaching → LMS`; the dep-cruiser rule `api-server-lms-no-coaching` is one-directional (forbids only lms→coaching). The shipped precedent for a coaching module reading the plan tree is `coach-metrics`. No new bounded context and no new dep-cruiser rule were needed (verified: `pnpm dep:check` clean, MP-7 closed). The legacy client lives in `infrastructure/` (cross-cutting, outside context rules).
- **Consequence.** api-server gained a `@repo/api-client` workspace dependency (the legacy adapter reuses `ApiClient` for timeout/retry/zod — an instance of the ADR-0013 port/adapter pattern, not a new architecture call). Owner-approved; `docs/DEPENDENCY-GRAPH.md` regenerated.
- **Links.** `docs/BOUNDED-CONTEXTS.md` §9; `coach-metrics`; `deferred.md` MP-7 (closed).

### D-7 — TOKEN AT REST: AES-256-GCM in api-server, env key, fail-closed

- **Status:** RATIFIED (P1a, 2026-06-25).
- **Decision.** The legacy access token (a live ADMIN bearer credential) is encrypted at rest with AES-256-GCM via `node:crypto` in `packages/api-server/src/utils/token-cipher.ts`. Wire format = base64 of `iv(12) ‖ ciphertext ‖ authTag(16)` (fixed offsets, no delimiter). The key comes from a new server env var `MOBILE_PUBLISH_ENCRYPTION_KEY` (base64 32-byte, validated `z.string().length(44)`), decoded once at module load with a 32-byte assertion (fail-closed at boot). Stored as a single `String @db.Text`.
- **Rationale.** No reversible cipher existed (only one-way bcrypt/sha256). It lives in api-server (server-only) NOT `@repo/shared` (client-reachable → key-leak risk). Invariants: never logged (log only `legacyUserId`+`expiresAt`), never on any DTO, never over the wire. A decrypt failure (tampered blob / rotated key) is caught and surfaced as a reconnect signal (`MOBILE_RECONNECT_REQUIRED`), never a 500 leaking crypto internals. The env var is feature-scoped (renamed from a generic `ENCRYPTION_KEY` during review, pre-prod, to avoid collisions).
- **Deferred.** Key rotation → `deferred.md` MP-9 (single key; a rotation invalidates all stored tokens → every coach reconnects — acceptable for a handful of coaches).
- **Links.** `utils/token-cipher.ts`; `reconnect-signal.ts`; `deferred.md` MP-9.

### D-8 — PROJECTION SEAM: shared UI-free renderRowLine (true SSOT)

- **Status:** RATIFIED (P1a, 2026-06-25 — owner chose option (b) at Gate A). Refines D-5's mechanism.
- **Decision.** The Day→legacy-text projection does NOT call `build-session-detail` (per-Session, emits view-models not prescription strings, ~80% wasted fields). Instead the platform's UI-free row-text formatters (`format-load`, `format-percentage-reference`, `format-tempo`, `format-rest-spec`, `format-rep-notation`, `format-side`, intensity-text, `resolve-intensity`) were extracted to a shared package `@repo/contracts/lms/row-text` exposing `renderRowLine(row, exerciseById, ctx): string`. BOTH the platform UI (`format-row-builders.ts`, which now delegates its text and keeps only `@repo/ui` styling) AND the api-server projection consume the SAME `renderRowLine` → true single-function SSOT, no drift by construction. A parity test (`projection/parity.test.ts`) is the executable form of the guarantee.
- **Rationale.** Reading every formatter showed the row-text family was already UI-free (the only `@repo/ui` couplings were type-only styling fields the legacy text discards), so the extraction was cheap AND permanent — honoring D-5's intent literally. The platform "display" is JSX chips, not a string; SSOT therefore holds at the FORMATTER level (the per-element text), and `renderRowLine`'s join order mirrors the chip visual order (exercise → volume → load → side → tempo → intensity → rest → modifiers → notes).
- **Spec corrections baked in (code wins over the original brief).** `trainingNumber` = 1-based index in the day's order-sorted session list (NOT `Session.order`, which steps by 10). `scheduledDate` via `sessionAbsoluteDateFromParts(week.startDate, day.dayOfWeek)` serialized with a UTC date-param helper (`utils/date-param.ts`, centralized from `week.mapper.ts`) — NOT `formatCalendarDate`/`formatDateParam`. **Rest-day detection uses the `Label.rest` boolean column** (the codebase's canonical signal at 3 sites), NOT a name string. Block name = `block.labels[0]?.name ?? ""`. Empty block → `exercises: []`. Block/schema intensity is threaded as raw VOs; inheritance happens inside `renderRowLine` (mirrors the platform).
- **Links.** `@repo/contracts/lms/row-text/*`; `projection/{project-day,parity.test}.ts`; supersedes the D-5 mechanism. The 9-ALT fallback (a copied renderer + MP-10) was NOT taken.

### D-9 — PUBLISHED-DAY LEDGER + idempotent decision logic + live-content skip

- **Status:** RATIFIED (P1a, 2026-06-25; decision logic hardened during the review fix-loop).
- **Decision.** `MobilePublishedDay { id, linkId→link (Cascade), scheduledDate @db.Date, legacyRowId Int, contentHash String, publishedAt, createdAt, updatedAt }` with `@@unique([linkId, scheduledDate])` + `@@index([linkId])` — one record per (link, calendar day); republish updates in place via `upsert`. Per-day publish returns `{ scheduledDate, action, legacyRowId }` with `action ∈ {created, updated, skipped, conflict, failed}`.
- **Decision logic (`decidePublishAction`, primitive inputs `{ isOwned, hasLegacyRow, contentMatches, overwriteUnowned }`):** no legacy row → POST/`created`; legacy row + not owned + `!overwriteUnowned` → `conflict`/no-write (D-4 overwrite-guard); legacy row + (owned ‖ overwrite) + content already matches → `skipped`; else → PUT/`updated`.
- **Hardening from review (load-bearing for the inviolable legacy prod):**
  1. **`skipped` compares to LIVE legacy content** (sha256 of the canonical projected JSON vs the fetched legacy row's content), NOT our stored hash — so an out-of-band iOS edit of an owned day is detected and re-published instead of silently skipped. `contentHash` is still stored in `MobilePublishedDay` as a ledger/audit field (+ future "ours vs theirs").
  2. **The 409-race fallback re-runs the overwrite-guard** (`resolveRace`): on a POST that races a `ConflictError`, it re-GETs and re-decides — a raced UNOWNED row with `overwriteUnowned=false` becomes `conflict`, never a blind clobber.
  3. **Per-day failure isolation (`failed` action):** a legacy 5xx/timeout on one day no longer discards the whole publish; that day is recorded `failed` (with the `AppError` code logged, never the token) and the rest proceed — the per-day results report exactly what landed.
- **Rationale.** The legacy POST is insert-only (409) with no DB unique on (level, date) (MP-8); the legacy prod DB is inviolable. `upsert` on `(linkId, scheduledDate)` makes OUR table race-free; the 409→PUT fallback + the guard converge concurrent publishes without clobbering coach-authored days. Multi-coach publishing to a shared global Level is intrinsic to the single-tenant legacy; the per-link record makes a cross-coach publish surface as `conflict`.
- **Refinement (PR #317 review).** `decidePublishAction` checks `contentMatches` BEFORE the unowned-guard, and a content-match skip on an unowned row CLAIMS the ledger (upsert) — so a row we authored after a timed-out write (→ retry → 409) is recognized as ours and skipped, never reported as a permanent `conflict`. Legacy writes (POST/PUT) are no-retry (a timed-out write may have committed); a legacy 401 mid-publish surfaces as `MOBILE_RECONNECT_REQUIRED`, not an opaque `failed` day.
- **Links.** `decide-publish-action.ts`, `publish.ts`, `publish-day.ts`; `deferred.md` MP-8 (residual legacy TOCTOU), MP-10 (week-publish resilience), MP-11 (row notes).

### D-10 — SURFACE PLACEMENT: inline LINK strip, PUBLISH-results modal, publish-all-linked

- **Status:** RATIFIED (owner, Gate-A, 2026-06-25).
- **Decision.** Surface D (LINK) = an inline "Mobile publishing" strip (the `EnrollmentsStrip` template) mounted between the enrollments strip and the `WeekNavigator` on `/coach/plans/[planId]`. Surface E (PUBLISH) = a primary "Publish this week" Button on the same strip — disabled when the plan has no link (tooltip "Link a training level first") — opening a `PublishWeekModal`. Multi-link publish targets **every** linked level (one `publish` mutation per link, `Promise.allSettled`); results render in the modal grouped by level name as `StatusChip`s; any `conflict` → a nested warning `ConfirmationModal` → confirm re-runs with `overwriteUnowned=true` (D-4, never auto).
- **Rationale.** Link state is glanceable plan-level daily status — coach-daily-UX is priority #1 (memory `coach-daily-ux-priority`); a kebab `MenuItem` hides it behind a click and gives no room for the Publish CTA + its disabled/tooltip state. Publish results are a transient action-confirmation, not page state (inline chips cause grid jank + a "when do they clear?" question); a persistent history is a P3 concern (the D-9 ledger already stores it server-side). The link IS the persistent declaration of intent (D-3), so publish honors all declared targets rather than re-picking per publish (which invites "published to Pro, forgot RX" mistakes).
- **Links.** `design.md` §6 A1/A2/A3, §7; `modules/plan-detail/components/{mobile-publishing-strip,publish-week-modal,publish-results-panel}.tsx`; `EnrollmentsStrip` template.

### D-11 — UNLINK IN SCOPE; DISCONNECT DEFERRED (cascade-blast-radius unresolved)

- **Status:** RATIFIED (owner, Gate-A, 2026-06-25).
- **Decision.** `DELETE /links/[id]` (+ `deleteLink` service, route, contract params, `useDeleteMobileLink` hook, a per-row delete affordance guarded by `ConfirmationModal type="danger"`) is IN P1b scope. `DELETE /connections` (disconnect) is DEFERRED to P3 (carry-forward, not built); the connect section shows "Reconnect", never "Disconnect", in P1b.
- **Rationale.** Unlink is bounded (one plan↔level) and required to change targets. Disconnect carries an unresolved data-model question: `MobilePublishLink.connection` AND `MobilePublishedDay.link` are both `onDelete: Cascade` (`schema.prisma:152,171`) → deleting a connection silently cascade-wipes **every plan's link AND the entire publish ledger for that coach** — an unbounded blast radius. P3 disconnect must first resolve warn-and-cascade vs restrict-if-linked before building. Reconnect-via-POST (the `connect` upsert replaces the token) covers the only real need — the monthly token expiry.
- **Links.** `design.md` §5.2 (cascade finding), §6 A5, §7, §9 OQ-1; `deferred.md` MP-4 (disconnect/token lifecycle); `schema.prisma:152,171`.

### D-12 — PROMOTE `MOBILE_RECONNECT_REQUIRED` TO CONTRACTS; one wire-contract SSOT

- **Status:** RATIFIED (owner, Gate-A, 2026-06-25).
- **Decision.** `MOBILE_RECONNECT_REQUIRED` (a wire-contract value carried in `error.details.reason` across the HTTP boundary) is promoted from api-server-only `reconnect-signal.ts` to `@repo/contracts/coaching/mobile-publish` (shipped as `mobile-publish.constants.ts`, flowing through the entity `index.ts`). api-server `reconnect-signal.ts` now imports + re-exports it (behavior-preserving, byte-identical literal — its existing importers `training-levels.ts`/`publish.ts`/`reconnect-signal.test.ts` keep resolving it unchanged). The client detects it via a shared `isReconnectRequired(error)` helper (`lib/api/is-reconnect-required.ts`, a narrowing `as` read of `details.reason` after `instanceof Error`). The reconnect CTA opens a reusable `ConnectMobileModal` from three surfaces: the connect section (primary + a proactive amber expiry nudge), the `ManageMobileLinksModal` (when `useTrainingLevels` errors reconnect-required), and the `PublishWeekModal` (when a publish errors reconnect-required).
- **Rationale.** It's a wire-contract value, so two copies (a duplicated client const) would drift silently if anyone renamed it, with no test binding them — `@repo/contracts` is the shared boundary package both sides already depend on. Low-risk additive change. Reconnect inline everywhere = no navigation/context-switch (coach-daily-UX).
- **Links.** `design.md` §5.4(6), §5.6, §6 A4, §7; `mobile-publish/mobile-publish.constants.ts`; `reconnect-signal.ts`; `lib/api/is-reconnect-required.ts`.

### D-13 — PROJECTION SYNTAX: schema-aware legacy text assembler; reframe the D-8 SSOT altitude

- **Status:** RATIFIED (owner, 2026-06-26) for the approach; exact format reviewed at the render-and-show gate (the AMRAP-vs-cap correction, §9, ratified there).
- **Decision.** The Day→legacy-text projection gets its own **schema-aware assembler** (`projection/format-legacy-schema.ts`) that renders each Schema as `header(structure + intensity, once) + blank line + reps-first movement lines` in Денys's house style, composing the **existing UI-free element formatters** (`format-composition-summary`, `formatLoad`, `formatRepNotation`, `formatRestSpec`, `formatTempo`, `formatSide`, intensity-text). The single-`renderRowLine` SSOT (D-8) is **reframed, not discarded**: SSOT holds at the **element-formatter** level (how a load/tempo/intensity renders — one place, no drift), while **line/schema assembly is a legacy-specific VIEW**, genuinely distinct from the platform's JSX-chip rendering. D-8 placed the SSOT one level too high (a single flat `renderRowLine` for both surfaces) → it dropped the whole Schema structural layer (`header`/`composition`/`intensity`), so published plans lost their EMOM/AMRAP/rounds identity (the coach feedback that triggered this). `projection/{parity,project-day}.test.ts` were rewritten: they had asserted the drop as correct; they now assert the structured output + element-formatter parity.
- **Rationale.** The platform "display" is chips/cards, not a string (D-8 admitted this); the legacy needs the structure flattened into scannable text with separators. Forcing one assembler for both was elegant-by-construction but failed the actual reader — we passed parity tests yet shipped text the coach couldn't scan. Element formatters stay shared (no drift on _how_ a value renders); only the _assembly_ forks. Projection-only — NO Prisma schema / migration / wire-contract / legacy change; the lone ripple is the D-9 content-hash delta that drives the intended PUT/`updated` on a re-publish of our own owned days (D-4 conflict-guard still protects coach-authored days).
- **AMRAP correction (owner, 2026-06-26).** `repetition.kind = "timeCap"` IS an AMRAP (the schema TYPE), so the projection labels it `AMRAP 20’`, not `cap 20’` — "cap" is a time limit on non-AMRAP work (the cross-cutting `composition.cap` field keeps "cap"). The SAME correction is owed to the shared formatter for the athlete-facing surfaces — deferred as MP-14 (it changes athlete UI, wants its own ratification).
- **Links.** `design-publish-syntax.md` (full spec §4/§5 format, §6 decision, §7 constraints, §9 AMRAP rule); `projection/format-legacy-schema.ts`, `projection/{project-day,parity}.test.ts`; supersedes the _mechanism_ of D-8 (the single flat `renderRowLine` for both surfaces); `deferred.md` MP-14.
