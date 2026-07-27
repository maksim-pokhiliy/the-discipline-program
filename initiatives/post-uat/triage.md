# post-uat — triage (the UAT feedback corpus, grounded in code 2026-07-27)

**Sources:** the Telegram UAT thread 2026-06-27 → 2026-07-26 (Denys, Tetiana, athletes' relayed feedback), 10 screenshots, one FB message, the 16.07 prod incident write-up (owner). **Method:** 6 parallel read-only recon agents over the monorepo + git history; every root cause below is verified against source, not inferred. **How to use:** each item carries an STR (steps to reproduce) for the owner's browser pass and a "verify after" check for post-merge confirmation. Registry + statuses: `plan.md`.

---

## PU-01 · BUG · platform/records — 1RM movement picker is a dead end

**Symptom.** Update 1RM → Movement autocomplete → type `squat` → "No options" (Tetiana, 27.06). Movements visibly exist on the same page.

**Root cause (confirmed).** The options list is scoped to movements the athlete ALREADY has a `OneRMRecord` for — `records-content.tsx:186-194` feeds the modal from `data.oneRM`, built by `records-view.ts:10-14` (`prisma.oneRMRecord.findMany({where:{userId}})`). A first-ever 1RM for any movement is therefore unloggable (chicken-and-egg). Regression commit `bb6ed890` (2026-06-19) deliberately swapped the full catalog for this list because the catalog endpoint 403s athletes: `apps/platform/src/app/api/platform/exercises/route.ts:16` (`withCoachAuth`) + `requireCoachLikeRole` (`endpoints/lms/exercise/platform.ts:12`), pinned by `platform.test.ts:53-62`. MUI default filtering is case-insensitive `includes` — filtering hypotheses ruled out.

**Fix.** Athlete-scoped read-only movement catalog: `listForAthlete` (CONCRETE-nature only, `{id, canonicalName}`) + new `athlete/movements` route (`withAthleteAuth` + rate-limit) + contract schema + hook (`staleTime: Infinity`) + union with existing record movements in `records-content.tsx`. Keeps the coach-only guard + its test intact. **~50 LOC / 6 files + 2 tests. Size S/M.**

**STR (owner).** Platform as athlete → Records → UPDATE 1RM → type a movement you have NO 1RM record for (e.g. `snatch`) → observe "No options". Bonus: a fresh athlete with zero records has a permanently empty picker.

**Verify after.** Same steps: catalog movements appear; logging a first-ever 1RM works; a coach-account probe of `/api/platform/exercises` still 403s athletes.

---

## PU-02 · BUG · platform/athlete-session — RX/SC spread line clips mid-token on phones

**Symptom.** "1-arm KB overhead walking lunges · 18 reps · RX Male:24 Female:16 / SC Male:16 Female:…" — cut mid-token; the athlete cannot see the Scaled-Female value (Tetiana, 27.06).

**Root cause (confirmed).** The spread string is a single unbreakable run: `whiteSpace: "nowrap"` on the load Typography (`schema-row.tsx:154-166`, esp. `:161`) and `flexShrink: 0` on group-member lines (`row-group.tsx:94-103`, esp. `:97`); the card's `overflow: "hidden"` (`schema-card.tsx:49-55`) does the clipping — no ellipsis, no wrap, ever. The screenshot shape (movement name fully visible) matches the **row-group** render path. A 2×2 Level×Gender matrix always yields the longest possible string.

**Fix.** Minimal: drop `nowrap` + `overflowWrap: "anywhere"` at `schema-row.tsx:161`, swap `flexShrink: 0` → `minWidth: 0` at `row-group.tsx:97` (**~6 LOC, S**). Better UX (recommended if W1 has room): `buildLoadLine` already builds a grouped `Map` in `formatTwoAxisSpread` (`athlete-session-presentation.ts:90-103`) and throws it away — render one line/chip per axis group (**~50-70 LOC, M**).

**STR (owner).** Phone or ~390px devtools → athlete day with a superset (row group) whose load is byProfile with 2 axes (RX/SC × M/F) → the spread clips at the right card edge.

**Verify after.** Same row wraps (or renders grouped); no horizontal clipping at 320-430px widths.

---

## PU-03 · BUG · platform/athlete-session — "the program won't let me be RX"

**Symptom.** Female athlete cannot switch herself to RX (Tetiana, 27.06 + video).

**Root cause (confirmed, two stacked gaps).** RX/SC is a coach-defined `ProfileAxis`; the athlete's pick lives in `AthleteProfile.profileSelections`. (1) The in-session picker exists ONLY while the load is `unresolved` — `buildLoadLine` returns a `prompt` only for unresolved states (`athlete-session-presentation.ts:188-224`); once a cell resolves, the affordance vanishes — there is no way to switch SC→RX from the day view. (2) Rows inside a **RowGroup have no picker at all** — `schema-card.tsx:123` passes no `editor` to `RowGroup`; `memberLine` discards `prompt` (`row-group.tsx:31-37`). Gender is auto-derived from the profile (`resolve-load.ts:21-29`, `binding === "GENDER"` axes are filtered out of the picker). No per-result RX flag exists anywhere (`result.ts:16-34`) — she can never "mark herself RX" on a result either. The only escape hatch is the Profile page picks card, unlinked from the session.

**Fix.** (a) Pass `editor` into `RowGroup` + render the per-member prompt (mirror `schema-row.tsx:143-169`) — **~20-25 LOC, S**. (b) For a resolved byProfile load, still return a re-openable prompt labeled with the current coord ("RX ▾") — **~15 LOC, S**. (c) RX-attribution on logged results = product feature, NOT this wave (see D-5 note; M/L if ever wanted).

**STR (owner).** As a female athlete with gender set: open a day with a Level×Gender byProfile row → pick "SC" when prompted → the prompt disappears; there is now no control to switch to RX from the day view. Then open a day where the same-shaped row sits inside a named group → no prompt existed at all.

**Verify after.** Grouped rows show the picker; a resolved row shows its current level as a tappable chip that re-opens the picker; switching SC→RX re-resolves the kg.

---

## PU-04 · BUG · platform/athlete-session — weight can be written exactly once

**Symptom.** "Where you must enter a weight, there's no way to replace it if you made a mistake — you can write it only once" (FB message, athlete).

**Root cause (confirmed).** Best-match flow = the **in-session 1RM prompt** on `% of 1RM` rows: create-only POST (`use-session-logging.ts:147-172` → `one-rm-record/admin.ts:8-24`, `prisma.oneRMRecord.create`), and the entry point self-destructs — once resolved, `buildLoadLine` returns `prompt: null` (`schema-row.tsx:167`). The contract literally lacks the id needed to re-open: `rowViewSchema` has no `exerciseId` (`session-detail.schema.ts:45-59`). Records-page "Update 1RM" can't correct either (append-only + PU-01's scoping). Secondary wedge: the idempotency submit-token resets only on success (`use-submit-token.ts:20-44`) — a persisted-but-unseen 2xx makes every corrected retry 409 until remount.

**Fix.** v1 (recommended, D-5): additive `exerciseId` on `rowViewSchema` + `buildRowView`, and `buildLoadLine` returns an "Edit 1RM" prompt for resolved percentage loads → re-opens `InlineOneRmEditor`, correction is an append (latest-wins is already the resolution law) — **~25-35 LOC, S/M, zero server change**. Plus: the PU-03(a) RowGroup editor (shared fix), and reset the submit token in `onSettled` — **~3 LOC**. True PATCH/DELETE history editing = separate decision, not this wave.

**STR (owner).** As an athlete on a `% of 1RM` row with no logged 1RM: tap the prompt → enter a WRONG weight → save → the row resolves and the prompt is gone; no way to correct from the day view.

**Verify after.** Resolved percentage rows show an edit affordance; correcting appends a new 1RM and the resolved kg updates; Records history shows both entries (append semantics preserved).

---

## PU-05 · BUG (semantic) · domain — "Ski · 18 cal @ 14 kg"

**Symptom.** AMRAP row `Ski — 18 cal @ 14 kg` (Denys red-circled it, 04.07). A kg load on a ski-erg calorie row is nonsense.

**Root cause (confirmed — not a render leak, a modeling trap).** The coach encoded a gender-scaled **calorie target** in the byProfile **load** grid because per-gender values exist ONLY on `load`, and every cell is hard-typed kg (`load.ts:43-54`). The repo's own fixture reproduces the exact prod workout (`project-day.test.ts:320-350`: Ski `unit_bound cal 18` + `profileLoad({rx, m:18, f:14})`). The athlete resolved Gender→F → `{resolved, kg:14}` → the presenter stamps `" kg"` (`athlete-session-presentation.ts:118-121`). Nothing anywhere couples reps-unit and load-kind (checked: contracts, compose write gate, server, api-routes — zero validation). The coach never sees the trap: his editor chip renders byProfile spreads **unit-less** (`format-load.ts:39-40`); only the byProfile grid itself says "kg". Published mobile text is also unit-less (`"18 cal Ski [ RX M:18 F:14 ]"`, `project-day.test.ts:368`) — reads as intended, so the **projection stays untouched**.

**Fix (mitigation now; true fix = PU-13).** Per D-4 (advisory, NOT a hard block — vest/farmer-carry loads on cardio rows are legitimate): (a) editor warning when `unit_bound × {cal,m,km,sec,min}` + non-null load, escalated copy for byProfile ("weights here are external load shown as kg — they do NOT scale the cal target") — **~35 LOC, S**; (b) audit script cloning `audit-load-kg-bounds.ts` flagging cardio-unit rows with loads, report-only, coach re-authors — **~90 LOC, S**; highest-signal bucket: `unit=cal ∧ byProfile ∧ some cell.kg == reps.value`. Optional (c): append resolved coords to the athlete chip ("14 kg · RX/Female") — additive contract field, can ride W1 or wait.

**STR (owner).** Athlete view of the live AMRAP (Denys's plan, week of 29.06) → the Ski row shows "@ 14 kg". Editor side: Edit Row on any cal row → the load section is fully active with zero warning.

**Verify after.** Editor shows the advisory on cal+load rows; audit script lists the offending prod rows for Denys to re-author; published text byte-identical (projection untouched).

---

## PU-06 · BUG ×2 · admin — user delete "doesn't work", edit form can't save

**Symptom.** "не дает удалить из админки и изменить имейл" (Denys, 19.07).

**Root cause (confirmed, two stacked defects).**

1. **For Denys (HEAD_COACH): 403.** `requireAdminStrict` (ADMIN only, `role-guards.ts:33-39`) guards update/role/delete (`users-admin.ts:93/101/148`) — the blanket sec-001 fix (`f3a13709`, pinned by `users-admin-actor-role.test.ts:79/128/141`). But `withAdminAuth` + admin proxy ADMIT HEAD_COACH, so the UI shows him Delete buttons and an Edit form that always 403. Asymmetry: he CAN create users (`users-admin.ts:49` unguarded).
2. **For a real ADMIN: latent list-brick.** `deleteUser` soft-deletes (suffixes email to `*_deleted_<ts>`), but `getAll` doesn't filter `deletedAt` (`users-admin.ts:35-41`) and the response schema requires `z.string().email()` (`user.schema.ts:21`) → `parseResponse` throws (`route-helpers.ts:39-47`) → **the first successful delete 500s `/api/admin/users/page-data` permanently**. Verified against repo zod. Side effects: dashboard counts + Recent Activity include deleted users.

**Fix.** **Fix A (urgent, S):** `where: {deletedAt: null}` in `getAll` + 404 on soft-deleted detail + dashboard hygiene + a test that soft-deletes then re-reads the list (the existing test hard-deletes in cleanup and hides this). **Fix B (M, gated on D-2):** replace blanket strict-guard with capability rules — HEAD_COACH may manage non-admin users; explicit denials: target is ADMIN / requested role is ADMIN / self role-change. Rewrites the 3 pinned test assertions deliberately.

**STR (owner).** DEV DB ONLY (prod delete would soft-delete a real user + brick the list): admin as HEAD_COACH → Users → delete any user → error; edit any field → save → error. As ADMIN on dev: delete a user → the row stays and the whole list errors out.

**Verify after.** Fix A: ADMIN delete removes the row, list + dashboard stay healthy. Fix B: HEAD_COACH can edit/delete non-admins, still 403s on admin targets + role escalation.

---

## PU-07 · FEATURE (small) · admin — email is not editable

**Symptom.** Same Denys message; the form says "Email cannot be changed after creation" (`user-form.tsx:46-51`).

**Grounding.** Deliberately unimplemented: `updateUserSchema` has no `email` (`user.schema.ts:52-57`), no endpoint writes it. Cheap to add: credentials-only auth (no adapter tables), email is the login identity, `tokenVersion` is the existing session kill-switch, `@unique` P2002 already maps to Conflict.

**Fix (M, ~3-4h).** Contract field (trim/lowercase/email/max, mirroring create) → `buildUpdatePayload` writes `email` + `emailVerified: null` + `tokenVersion: {increment: 1}` (forced re-login beats a stale JWT email) → guard collision with soft-deleted suffixed emails → enable the form field with a "user will be signed out" warning. Access level follows D-2.

**STR.** n/a (absence feature). **Verify after.** Change an athlete's email on dev → they're signed out, old email dead, new email logs in; duplicate email → clean conflict message.

---

## PU-08 · UX · mobile-publish — linking reads as publishing → **executes as MP-22 in `mobile-publish`**

The 16.07 prod incident (Denys created an INDIVIDUAL link for Stas, never pressed Publish, athlete's app empty, half-hour debugging; zero publish requests in logs — system worked, UX failed). The owner's spec is complete: per-link publish aggregate (`count + max(publishedAt)`) on GET /links (additive), per-link "Never published / Last published: 11 Jul" status, "Publish this week" as the primary action until first publish, + REV-I4 tooltip copy. Caveat: the status is WEEK-scoped — must not read as "whole plan sent". **~half a day, `/feature small`, tracked as MP-22 in `initiatives/mobile-publish/`.**

---

## PU-09 · FEATURE (XS) · marketing — no login entry point on the site

**Symptom.** Tetiana opened the site on a laptop to log in — nothing; dug the platform link out of email (27.06). Zero external links exist on the marketing site today.

**Grounding.** `NEXT_PUBLIC_PLATFORM_URL` is already a required client env var (`packages/env/src/base.ts:20`) and `@repo/env` is already imported in marketing — zero plumbing. Header right slot is free (`header/index.tsx` centers nav absolutely); mobile drawer at `drawer.tsx:38`. Must be a plain `Button component="a"` (NavLinkButton is internal-route-only). Target: `${NEXT_PUBLIC_PLATFORM_URL}/login`.

**Fix.** Best case 2 files / ~15 LOC; clean version (nav-config `external` flag) 5 files / ~40 LOC. Check marketing CSP (`proxy.ts` createCspResponse) doesn't block outbound nav (plain links normally unaffected).

**Verify after.** Desktop header + mobile drawer show "Log in" → platform login; active-state styling unaffected.

---

## PU-10 · FEATURE (S) · marketing — socials on /contact + footer

**Symptom.** "додати соц мережі для контакту — люди лінуються форми заповняти" (27.06).

**Grounding.** No social links anywhere today (`footerLinks: []`, zero instagram/tiktok hits; `sameAs` was dropped from structured data). Git history has both the data and the UI: handles in `f2e13f3e` (`t.me/the_discipline_channel`, `instagram.com/denis_sergeev_coach`, `t.me/denis_sergeev_coach` — **confirm currency with Denys**) and a ~120-line direct-contact card grid (needs a new Instagram icon branch — the old union never rendered IG).

**Fix.** Hardcoded `SOCIAL_LINKS` config + icon-map component + mount on /contact (below the form, `ContentSection` wrapper for the site's motion language) + footer instance (serves every page) + restore `sameAs` (SEO). A CMS-editable section is over-plumbing for 3 stable URLs — explicitly rejected for now. **S, ~2-3h.**

**Verify after.** /contact + footer render the links; structured data carries `sameAs`.

---

## PU-11 · FEATURE (S) · notifications — contact-form submissions notify nobody

**Symptom.** Denys found form submissions days late; one lead had already gone to Instagram (16.07). Owner promised: email + Telegram, "воскресим бота".

**Grounding.** Two pipelines, same table: the program-CTA **lead** modal ALREADY sends a Resend email to the head coach (`lead-inbound.ts:22-34` → `send-lead-notification-email.ts`); the generic **/contact** form saves and notifies nobody (`cms/contact/inbound.ts:10-21`) — a documented deliberate deferral, pre-approved as an "easy follow-up" (`initiatives/pre-launch/marketing-lead-capture-feature-prompt.md:189`). The old Telegram bot is fully resurrectable: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts` (42-line service; env `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`; removed 2026-02-25 as a scope cut; roadmap says "Telegram v1.1+" → D-3 supersession). **Risk to check FIRST: `RESEND_API_KEY`/`EMAIL_FROM` are optional env — if unset in prod, even lead emails have been silently skipped** (`email-sender.ts:74-78` logs `lead.email_config_missing`).

**Fix.** (a) ~12-line notify call in `inbound.ts:20` mirroring the lead path; (b) resurrect the Telegram service: env sub-schema `packages/env/src/telegram.ts` + `logger` + field rename `email`→`contact` + turbo.json/.env.example entries + fire-and-forget call from BOTH pipelines; (c) verify prod Vercel env (Resend + new Telegram vars). `head-coach@` mailbox = PU-15 (ops, owner). **S total.**

**Verify after.** Dev submit on /contact → email + TG message; prod submit test post-deploy; Vercel envs confirmed.

---

## PU-12 · FEATURE (M/L) · platform — guided workout timer (EMOM first)

**Ask.** Tap the EMOM → fullscreen timer: running clock, current minute's exercise, Rest indicator, auto-advance (27.06; suspect the 18.07 TikTok link is a reference — ask).

**Scoping (what exists / what's missing).** Composition lives on **Schema**, not Block (`schema.schema.ts:17`) → the tap target is the schema card (or a parallel-group track). The athlete client ALREADY receives `composition` verbatim (`session-detail.schema.ts:73`): `cadence {everyMin: int(minutes only), rounds}`, `interval {work{value,unit}, off{value,unit — 0 allowed}, count}`, `timeCap {cap}`. Gaps: (1) row→minute mapping is derived-on-read, coach-app-only (`derive-minute-view.ts:25`, `index % rounds`, D-EMOM-UX "never stored"; slotSpec = DEFER-001 lineage) — the athlete side must mirror the same derivation; (2) REST minutes are REST-natured exercise rows and **nature/exerciseId are stripped from the athlete wire** (`rowViewSchema:45-59`) — needs an additive field; (3) seconds-EMOM (E90s) unrepresentable (`everyMin` int) — out of v1; (4) no timer primitive exists in the repo at all; (5) `label.family === "INTERVALIC"` (derived) is the clean gate for showing the affordance. Row-level `rest` is delivered but never rendered athlete-side — timer UI may surface it.

**v1 proposal.** `cadence` + `interval` + `timeCap` timers on the schema card; additive `nature` (or `isRest`) on rowView; minute view mirrors the coach derivation. UI-first on mocks per the training-domain rule. **`/feature` (full), own Gate A.**

---

## PU-13 · FEATURE (L) · domain — per-gender volume (M/F calories) = the true fix of PU-05

**Ask.** "когда выставляю калории, сделать отдельно для М и Ж" (Denys, 23.07).

**Reach statement (verified).** Per-gender values today cover exactly one thing: `load.kind === "byProfile"` with kg cells. NOTHING else on the row (reps count/range/unit_bound, sets, tempo, side, rest, intensity) has an axis dimension — the model itself is load-kg-scoped, not merely editor-gated. Extending to cal rows touches: **contracts** (a 5th `repNotationSchema` arm or a generalized byProfile cell primitive shared by load+reps — `load.ts` is a sacred VO, zero-diff rule, needs its own ratified design + the four-projection gate + parity-test updates), **editor** (reps-side axes/cells grid; `by-profile-cells.ts` helpers are kg-typed), **resolver** (new reps resolver + `resolvedReps` sibling on rowView), **athlete renderer** (variant-blind `formatReps`), **mobile-publish formatter** (`format-rep-notation.ts` + `render-row-line.ts` need the spread branch + a bracketing decision). **Prisma: NO migration** (Json columns). Lineage: P6-REPS-UNIT (coach-station deferred). **Own `/feature` with a design doc; do NOT fold into a fix wave.**

---

## PU-14 · INITIATIVE CANDIDATE · payments — self-serve weekly plan purchase

**Ask.** Denys away → his SPLIT (personal-training) athletes buy a weekly plan on the site and train; online payment without his involvement (26.07; Tetiana holds the detailed vision). Prior art: roadmap Phase-5 billing (Monobank webhook lineage); athlete-core deferred "auto-create an empty plan on a personal-product purchase" couples directly. **Action here: collect Tetiana's brief → charter a separate initiative** (payment provider for UA — Monobank acquiring vs WayForPay/LiqPay/Fondy — delivery mechanics, product model). This is the first INBOUND monetization pull — do not let it rot.

---

## PU-15 · OPS · `head-coach@thedisciplineprogram.com` mailbox

Owner-side infra (mail provider), promised to Denys 16.07. Not code; listed so it doesn't get lost. Once created → consider `EMAIL_REPLY_TO`.

---

## PU-16 · INVESTIGATE · "на сайті є, але без тих змін шо були" (Stas, 16.07)

During the publish incident Stas reported the PLATFORM view showed his plan "without the changes that were made". The app-side emptiness is fully explained (never published); the platform-staleness half was never reproduced — could be group-vs-individual plan confusion, an enrollment/clone semantic, or query caching. **Needs info from Denys/Stas:** what exactly was edited, where he looked, timestamps. STR impossible until then. Park; do not scope blind.

---

## Non-items (dispositioned)

- **Legacy iOS app rejects platform creds** — by design (separate auth domain); unification = MP-NORTH-STAR. Explain to testers, no code.
- **Live social content on the site** — content production (Denys), not code. Revisit only if an embed feature is explicitly requested.
- **TikTok link 18.07** — content unknown; ask the owner (suspected timer reference for PU-12).
