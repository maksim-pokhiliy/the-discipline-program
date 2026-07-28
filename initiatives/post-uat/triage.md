# post-uat — triage (the UAT feedback corpus, grounded in code 2026-07-27)

**Sources:** the Telegram UAT thread 2026-06-27 → 2026-07-26 (Denys, Tetiana, athletes' relayed feedback), 10 screenshots, one FB message, the 16.07 prod incident write-up (owner). **Method:** 6 parallel read-only recon agents over the monorepo + git history; every root cause below is verified against source, not inferred. **How to use:** each item carries an STR (steps to reproduce) for the owner's browser pass and a "verify after" check for post-merge confirmation. Registry + statuses: `plan.md`. **Owner feedback round 27.07 folded in:** PU-01 design-check answered (→ D-6), PU-03 reframed (switch worked, feedback was invisible), PU-06 two-account workaround (→ D-2 ratified), PU-12/PU-13 scope expanded, PU-16 closed, PU-17 added.

---

## PU-01 · BUG · platform/records — 1RM movement picker is a dead end

**Symptom.** Update 1RM → Movement autocomplete → type `squat` → "No options" (Tetiana, 27.06). Movements visibly exist on the same page.

**Root cause (confirmed).** The options list is scoped to movements the athlete ALREADY has a `OneRMRecord` for — `records-content.tsx:186-194` feeds the modal from `data.oneRM`, built by `records-view.ts:10-14` (`prisma.oneRMRecord.findMany({where:{userId}})`). A first-ever 1RM for any movement is therefore unloggable (chicken-and-egg). Regression commit `bb6ed890` (2026-06-19) deliberately swapped the full catalog for this list because the catalog endpoint 403s athletes: `apps/platform/src/app/api/platform/exercises/route.ts:16` (`withCoachAuth`) + `requireCoachLikeRole` (`endpoints/lms/exercise/platform.ts:12`), pinned by `platform.test.ts:53-62`. MUI default filtering is case-insensitive `includes` — filtering hypotheses ruled out.

**Owner check (27.07): "это же по дизайну — там только движения, которые тренер хотя бы раз пометил как бенчмарк?"** Verified — **no.** The list is not coach-benchmark-scoped; it is scoped to the athlete's OWN `OneRMRecord` rows. The coach link exists but is indirect and different: a record appears only after the athlete logs one — via the in-session `% of 1RM` prompt, or as the side-effect append of a LOAD-type benchmark result (`benchmark-result/admin.ts:56-66`). Either way a fresh athlete has a permanently EMPTY picker (Tetiana's screenshot state — any input yields "No options"), and a proactive first-ever 1RM (her actual intent: log her squat) is impossible from Records. → **D-6 OPEN:** (a) open a read-only movement catalog to athletes (fix below), or (b) declare the record-scope intended and replace the dead autocomplete with an honest empty-state ("1RMs appear here once a workout asks for one"). Recommendation: (a) — records are athlete-owned by ratified stance, and proactive logging is a legitimate athlete flow. **D-6 RATIFIED = (a) same day:** «открываем атлету ридонли список, пусть ставит что хочет».

**Fix (D-6 = a).** Athlete-scoped read-only movement catalog: `listForAthlete` (CONCRETE-nature only, `{id, canonicalName}`) + new `athlete/movements` route (`withAthleteAuth` + rate-limit) + contract schema + hook (`staleTime: Infinity`) + union with existing record movements in `records-content.tsx`. Keeps the coach-only guard + its test intact. **~50 LOC / 6 files + 2 tests. Size S/M.** (If D-6 = b: empty-state copy + drop the autocomplete for recordless athletes, ~15 LOC.)

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

## PU-03 · UX · platform/athlete-session — level switch applies but is not PERCEIVED (→ design round Wd)

**Symptom.** "Не хоче твоя програма, шоб я була RX" (Tetiana, 27.06 + video). **Owner reframe (27.07, third refinement — final): she switched on her PROFILE page, and EVERYTHING updated everywhere, including the kg number on the workout screen. She just could not perceive that the change had applied** — the number changes with no label naming the level and no confirmation moment, so the update does not read as "it worked". This is a pure perception/interaction-design gap; nothing is broken.

**Root cause (re-verified against code; consistent with the reframe).** The workout screen never names the active level: a resolved byProfile line renders a bare kg number — the resolved arm carries only `{kg, perHand}` (`session-detail.schema.ts:20-21`) — so after a profile-side switch the number changes silently and nothing says "you are RX now". The in-session re-switch affordance doesn't exist either (`buildLoadLine` returns no prompt on resolved — `athlete-session-presentation.ts:188-224`) — which is exactly WHY she ended up switching on the Profile page. Secondary friction on the FIRST in-session pick: `pickProfile` closes the popover instantly on success (`use-session-logging.ts:174-200`; one pickable axis → every tap is a full pick). Intact from recon: rows inside a **RowGroup never render a picker at all** (`schema-card.tsx:123` passes no `editor`; `row-group.tsx:31-37` discards prompts).

**Disposition (owner, corpus read 27.07): DEFERRED TO A CLAUDE-DESIGN ROUND (Wd) before execution** — the sketch below is input for that round, not a ratified spec.

**Fix sketch (design-round input; converges with PU-05c — one mechanism).** (a) **Label the resolved value with the picked coordinate** ("RX · 24 kg") — additive `coords` on the resolved arm (the server knows them at `resolve-load.ts:91`) or client-side derivation from `load.axes` + selections. This is simultaneously the missing switch-feedback AND the PU-05 honesty fix ("14 kg · RX/Female" exposes a mis-encoded grid). (b) Keep a prompt on resolved rows (label = current level, "RX ▾") so the picker re-opens and the switch is explorable — **~15 LOC, S**. (c) Pass `editor` into `RowGroup` so grouped rows get the same affordances — **~20-25 LOC, S**. ~~Polish candidate: don't slam the popover — reflect the new active state for a beat before closing.~~ DROPPED (owner, 2026-07-28: «это не нужно»).

**Scope addition (owner, 2026-07-28, D-8 round): the PROFILE-page switcher itself.** The level switch on the Profile page is plain MUI `Button`s where the only "selected" signal is the variant flipping to contained — the athlete switched, everything worked, and she did not read that state change as "applied". A `Button` semantically promises an action, not a selection state; MUI has dedicated selection primitives (`ToggleButtonGroup`, selectable `Chip`, `Radio`). Which primitive and what the "applied" feedback moment looks like — in the profile AND in-session — is part of the Wd design round.

**STR (owner).** As a female athlete with a picked level: open a workout → resolved byProfile rows show only a kg number, nothing names the active level. Switch RX↔SC on the Profile page → return to the workout → the number changed silently; nothing confirms which level produced it, and there is no in-session control to switch back. In a named group: no picker exists at all.

**Verify after.** Resolved rows show the level label; tapping it re-opens the picker; switching updates kg + label; grouped rows behave identically.

---

## PU-04 · BUG · platform/athlete-session — weight can be written exactly once (→ design round Wd)

**Symptom.** "Where you must enter a weight, there's no way to replace it if you made a mistake — you can write it only once" (FB message, athlete).

**Root cause (confirmed).** Best-match flow = the **in-session 1RM prompt** on `% of 1RM` rows: create-only POST (`use-session-logging.ts:147-172` → `one-rm-record/admin.ts:8-24`, `prisma.oneRMRecord.create`), and the entry point self-destructs — once resolved, `buildLoadLine` returns `prompt: null` (`schema-row.tsx:167`). The contract literally lacks the id needed to re-open: `rowViewSchema` has no `exerciseId` (`session-detail.schema.ts:45-59`). Records-page "Update 1RM" can't correct either (append-only + PU-01's scoping). Secondary wedge: the idempotency submit-token resets only on success (`use-submit-token.ts:20-44`) — a persisted-but-unseen 2xx makes every corrected retry 409 until remount.

**Disposition (owner, corpus read 27.07): DEFERRED TO A CLAUDE-DESIGN ROUND (Wd) before execution** — the correction affordance's shape is a design question. **Updated 2026-07-28 (D-8, Wd corpus read):** the D-5 "not history editing" clause is superseded — the athlete gets history-hygiene rights on his own 1RM records (a typo-then-correction must not leave a garbage row forever). The operation set (edit / delete / exclude-from-stats, any subset) and its look are the design round's call; tech-lead rec into the round: edit + delete only. Latest-wins resolution and athlete ownership survive any outcome; append stays the flow for new maxes and in-session entry.

**Fix sketch (design-round input).** v1 (recommended, D-5): additive `exerciseId` on `rowViewSchema` + `buildRowView`, and `buildLoadLine` returns an "Edit 1RM" prompt for resolved percentage loads → re-opens `InlineOneRmEditor`, correction is an append (latest-wins is already the resolution law) — **~25-35 LOC, S/M, zero server change**. Plus: the PU-03(a) RowGroup editor (shared fix), and reset the submit token in `onSettled` — **~3 LOC**. True PATCH/DELETE history editing = separate decision, not this wave.

**STR (owner).** As an athlete on a `% of 1RM` row with no logged 1RM: tap the prompt → enter a WRONG weight → save → the row resolves and the prompt is gone; no way to correct from the day view.

**Verify after.** Resolved percentage rows show an edit affordance; correcting appends a new 1RM and the resolved kg updates; Records history shows both entries (append semantics preserved).

---

## PU-05 · BUG (semantic) · domain — "Ski · 18 cal @ 14 kg"

**Symptom.** AMRAP row `Ski — 18 cal @ 14 kg` (Denys red-circled it, 04.07). A kg load on a ski-erg calorie row is nonsense.

**Root cause (confirmed — not a render leak, a modeling trap).** The coach encoded a gender-scaled **calorie target** in the byProfile **load** grid because per-gender values exist ONLY on `load`, and every cell is hard-typed kg (`load.ts:43-54`). The repo's own fixture reproduces the exact prod workout (`project-day.test.ts:320-350`: Ski `unit_bound cal 18` + `profileLoad({rx, m:18, f:14})`). The athlete resolved Gender→F → `{resolved, kg:14}` → the presenter stamps `" kg"` (`athlete-session-presentation.ts:118-121`). Nothing anywhere couples reps-unit and load-kind (checked: contracts, compose write gate, server, api-routes — zero validation). The coach never sees the trap: his editor chip renders byProfile spreads **unit-less** (`format-load.ts:39-40`); only the byProfile grid itself says "kg". Published mobile text is also unit-less (`"18 cal Ski [ RX M:18 F:14 ]"`, `project-day.test.ts:368`) — reads as intended, so the **projection stays untouched**.

**Outcome (D-4 RATIFIED 27.07): NO interim mitigation.** Owner, verbatim: «ничего не инертим и не делаем временных фиксов и заплаток, просто сразу делаем нормально, а до тех пор Ден живет с тем что есть». The advisory + audit-script sketches are DROPPED; this section remains as the **evidence case for PU-13 (profiling v2)** — the byProfile grid is kg-only, per-gender VOLUME has no home, and this is the trap that proves it. Incidental W1 side effect: the resolved-coords label (PU-03a) will make the Ski line read "14 kg · RX/Female" — honest about where the number comes from, still kg-framed until profiling v2.

---

## PU-06 · BUG ×2 · admin — user delete "doesn't work", edit form can't save

**Symptom.** "не дает удалить из админки и изменить имейл" (Denys, 19.07).

**Root cause (confirmed, two stacked defects).**

1. **For Denys (HEAD_COACH): 403.** `requireAdminStrict` (ADMIN only, `role-guards.ts:33-39`) guards update/role/delete (`users-admin.ts:93/101/148`) — the blanket sec-001 fix (`f3a13709`, pinned by `users-admin-actor-role.test.ts:79/128/141`). But `withAdminAuth` + admin proxy ADMIT HEAD_COACH, so the UI shows him Delete buttons and an Edit form that always 403. Asymmetry: he CAN create users (`users-admin.ts:49` unguarded).
2. **For a real ADMIN: latent list-brick.** `deleteUser` soft-deletes (suffixes email to `*_deleted_<ts>`), but `getAll` doesn't filter `deletedAt` (`users-admin.ts:35-41`) and the response schema requires `z.string().email()` (`user.schema.ts:21`) → `parseResponse` throws (`route-helpers.ts:39-47`) → **the first successful delete 500s `/api/admin/users/page-data` permanently**. Verified against repo zod. Side effects: dashboard counts + Recent Activity include deleted users.

**Owner update (27.07, ratified as D-2).** Denys now operates a SEPARATE ADMIN account (two-account model: ADMIN for the console, HEAD_COACH for the platform). Consequences: the 403 no longer blocks his daily work, but **the latent list-brick became a LIVE risk** — under ADMIN he CAN trigger the first successful soft-delete. **Until Fix A ships: do NOT delete users in the prod admin.** The old Fix B (HEAD_COACH capability rules) is DROPPED.

**Fix.** **Fix A (URGENT, S — candidate for an immediate standalone mini-fix):** `where: {deletedAt: null}` in `getAll` + 404 on soft-deleted detail + dashboard hygiene + a test that soft-deletes then re-reads the list (the existing test hard-deletes in cleanup and hides this). **Fix A′ (honest UI, XS):** hide user-mutation controls (delete button, edit-form save) from HEAD_COACH sessions — the coach account must stop showing dead buttons that always 403.

**STR (owner).** DEV DB ONLY: as ADMIN on dev, delete a user → the row stays and the whole users list errors out permanently. As HEAD_COACH: Users still shows Delete/Edit that always fail.

**Verify after.** Fix A: ADMIN delete removes the row, list + dashboard stay healthy. Fix A′: HEAD_COACH sees no mutation controls.

**Investigation outcome (2026-07-27, Fix-A executor run).** **Fix A is REFUTED at runtime.** The recon's _mechanism_ is real, but it never fires, because this repo enforces soft-delete filtering CENTRALLY rather than per query: `db/client.ts:7-16` lists `"User"` in `SOFT_DELETE_MODELS`, and the `$extends` block (`:119-225`) injects `where.deletedAt = null` into `findMany`/`findFirst`/`findFirstOrThrow`/`count`/`aggregate`/`groupBy` and null-filters `findUnique`/`findUniqueOrThrow`. So the absent `where` at `users-admin.ts:36` is the _expected_ shape here, not a missing filter; the by-id read returns `null` → `NotFoundError` (a clean 404); dashboard counts and Recent Activity are filtered too. Every line reference in the original recon is exact — only the conclusions drawn from them were wrong, because the static read stopped at the call site. **Proof:** a new guard test (soft-delete via the real `deleteUser` → re-read `getPageData()` → parse `getUsersPageDataResponseSchema` → second delete) is green on `main`; removing `"User"` from `SOFT_DELETE_MODELS` turns it red with exactly the predicted `validation: 'email'` / `"Invalid email"` at `users[N].email`. The predicted 500 is one config line away — which is precisely why the guard is worth keeping. **Consequences:** Fix A ships as regression tests only, with zero production-code change; the standing "no user deletion in the prod admin" freeze is **LIFTED**; Fix A′ (honest UI) is unaffected and ships as specified.

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

**Grounding.** No social links anywhere today (`footerLinks: []`, zero instagram/tiktok hits; `sameAs` was dropped from structured data). Git history has UI prior art (`f2e13f3e`, a ~120-line direct-contact card grid; its old type union never rendered IG — icon branches needed). **Final links (Denys, 27.07 — brand channels only, canonical, no tracking params):** `https://www.youtube.com/@the_discipline_program` · `https://t.me/the_discipline_channel` · `https://www.instagram.com/the_discipline_program` · `https://www.strava.com/clubs/TheDisciplineProgram` (resolved from a `strava.app.link` share link; `share_sig` stripped). The git-era personal handles (`denis_sergeev_coach` IG/TG) are superseded — do NOT publish them. Icon note for W4: `@mui/icons-material` has YouTube/Telegram/Instagram but NO Strava — the Strava entry needs a small custom SVG icon component.

**Fix.** Hardcoded `SOCIAL_LINKS` config + icon-map component + mount on /contact (below the form, `ContentSection` wrapper for the site's motion language) + footer instance (serves every page) + restore `sameAs` (SEO). A CMS-editable section is over-plumbing for 3 stable URLs — explicitly rejected for now. **S, ~2-3h.**

**Verify after.** /contact + footer render the links; structured data carries `sameAs`.

---

## PU-11 · FEATURE (S) · notifications — contact-form submissions notify nobody

**Symptom.** Denys found form submissions days late; one lead had already gone to Instagram (16.07). Owner promised: email + Telegram, "воскресим бота".

**Grounding.** Two pipelines, same table: the program-CTA **lead** modal ALREADY sends a Resend email to the head coach (`lead-inbound.ts:22-34` → `send-lead-notification-email.ts`); the generic **/contact** form saves and notifies nobody (`cms/contact/inbound.ts:10-21`) — a documented deliberate deferral, pre-approved as an "easy follow-up" (`initiatives/pre-launch/marketing-lead-capture-feature-prompt.md:189`). The old Telegram bot is fully resurrectable: `git show 38f4a304^:packages/api-server/src/services/notification.service.ts` (42-line service; env `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`; removed 2026-02-25 as a scope cut; roadmap says "Telegram v1.1+" → D-3 supersession). **Risk to check FIRST: `RESEND_API_KEY`/`EMAIL_FROM` are optional env — if unset in prod, even lead emails have been silently skipped** (`email-sender.ts:74-78` logs `lead.email_config_missing`).

**Fix.** (a) ~12-line notify call in `inbound.ts:20` mirroring the lead path; (b) resurrect the Telegram service: env sub-schema `packages/env/src/telegram.ts` + `logger` + field rename `email`→`contact` + turbo.json/.env.example entries + fire-and-forget call from BOTH pipelines; (c) verify prod Vercel env (Resend + new Telegram vars). `head-coach@` mailbox = PU-15 (ops, owner). **S total.**

**Verify after.** Dev submit on /contact → email + TG message; prod submit test post-deploy; Vercel envs confirmed.

---

## PU-12 · FEATURE (L) · platform — athlete session screen v2: guided execution (owner expanded 27.07)

**Ask.** Initially: tap the EMOM → fullscreen timer with running clock, current minute's exercise, Rest indicator, auto-advance (27.06). **Owner expansion (27.07): "не только EMOM — эта штука разворачивается в полный масштабный допил скрина тренировки атлета."** So the deliverable is a guided-execution rework of the athlete workout screen — timers for the whole interval family + the screen experience itself. Likely spins off into its own initiative at design time; UI-first on mocks per the training-domain rule. (The 18.07 TikTok link is suspected reference material — still unanswered.)

**Scoping (what exists / what's missing).** Composition lives on **Schema**, not Block (`schema.schema.ts:17`) → the tap target is the schema card (or a parallel-group track). The athlete client ALREADY receives `composition` verbatim (`session-detail.schema.ts:73`): `cadence {everyMin: int(minutes only), rounds}`, `interval {work{value,unit}, off{value,unit — 0 allowed}, count}`, `timeCap {cap}`. Gaps: (1) row→minute mapping is derived-on-read, coach-app-only (`derive-minute-view.ts:25`, `index % rounds`, D-EMOM-UX "never stored"; slotSpec = DEFER-001 lineage) — the athlete side must mirror the same derivation; (2) REST minutes are REST-natured exercise rows and **nature/exerciseId are stripped from the athlete wire** (`rowViewSchema:45-59`) — needs an additive field; (3) seconds-EMOM (E90s) unrepresentable (`everyMin` int) — out of v1; (4) no timer primitive exists in the repo at all; (5) `label.family === "INTERVALIC"` (derived) is the clean gate for showing the affordance. Row-level `rest` is delivered but never rendered athlete-side — timer UI may surface it.

**Timer-core v1 (within the bigger design).** `cadence` + `interval` + `timeCap` timers on the schema card; additive `nature` (or `isRest`) on rowView; minute view mirrors the coach derivation. The screen-v2 design pass decides what else the rework covers (row states, logging flow, rest rendering — note row-level `rest` is delivered but never rendered today). **Design-first → own charter or a `/feature` (full) with its own Gate A.**

---

## PU-13 · FEATURE (L) · domain — profiling v2: per-gender/level values beyond kg (owner: design-first)

**Ask.** "когда выставляю калории, сделать отдельно для М и Ж" (Denys, 23.07). **Owner direction (27.07): "нужна переработка дизайна — там сейчас только килограммы, и вообще профайлинг сырой, его нужно проектировать."** So this is NOT a point feature (M/F calories) but a design-first rework of the profiling system — byProfile beyond kg cells; the M/F-calories ask is the first concrete use case, the Ski trap (PU-05) is the evidence. Likely its own initiative at start. The reach statement below is the ground map for that design.

**Reach statement (verified).** Per-gender values today cover exactly one thing: `load.kind === "byProfile"` with kg cells. NOTHING else on the row (reps count/range/unit_bound, sets, tempo, side, rest, intensity) has an axis dimension — the model itself is load-kg-scoped, not merely editor-gated. Extending to cal rows touches: **contracts** (a 5th `repNotationSchema` arm or a generalized byProfile cell primitive shared by load+reps — `load.ts` is a sacred VO, zero-diff rule, needs its own ratified design + the four-projection gate + parity-test updates), **editor** (reps-side axes/cells grid; `by-profile-cells.ts` helpers are kg-typed), **resolver** (new reps resolver + `resolvedReps` sibling on rowView), **athlete renderer** (variant-blind `formatReps`), **mobile-publish formatter** (`format-rep-notation.ts` + `render-row-line.ts` need the spread branch + a bracketing decision). **Prisma: NO migration** (Json columns). Lineage: P6-REPS-UNIT (coach-station deferred). **Own `/feature` with a design doc; do NOT fold into a fix wave.**

---

## PU-14 · INITIATIVE CANDIDATE · payments — storefront subscription commerce (owner-scoped 27.07)

**Ask (final form, owner 27.07).** Not a point feature for the away-period: **every storefront product on the marketing app binds to a training plan; purchase → the user is auto-enrolled; billing runs as a regular subscription — charged until the user cancels.** «Это большая работа» — an initiative of its own. The original 26.07 trigger (SPLIT athletes buying a weekly plan while the coach is away) is one use case inside it; Tetiana's detailed vision is an additional input, not a charter gate. This is the first INBOUND monetization pull — do not let it rot.

**Grounding (what already exists).** The billing skeleton is ALREADY in the schema: `Price` (`productId`, `Currency USD/EUR/UAH`, `PriceInterval MONTHLY/YEARLY/ONE_TIME`), `Subscription` (`userId @unique` — one subscription per user; `status`, `currentPeriodStart/End`, `graceEndsAt`, `canceledAt`), `Transaction` (`amountCents`, `providerTxId @unique`, `idempotencyKey @unique`), `RequestIdempotency` (`packages/api-server/prisma/schema.prisma` ~`:226-300`). `PlanEnrollment` exists independently (`:362`). **Missing:** the Product→TrainingPlan binding (Product has no plan link today), the payment-provider integration (checkout, card tokenization/recurring, webhooks), the subscription→enrollment lifecycle (activate→enroll; lapse/grace/cancel→pause or un-enroll), and all UI (storefront checkout, athlete billing page, admin). Prior art: roadmap Phase-5 billing (Monobank lineage); athlete-core deferred "auto-create an empty plan on a personal-product purchase" — the personal-product flavor (purchase spins an EMPTY plan instead of enrolling into an existing one); both flavors belong to this charter.

**Charter-time key decisions (preview, not now):** UA-capable recurring provider (Monobank acquiring vs LiqPay/WayForPay/Fondy vs foreign-entity Stripe) · one-subscription-per-user (`userId @unique`) vs per-product subscriptions · what cancellation/lapse does to enrollment and to published mobile links · grace semantics (`graceEndsAt` already modeled). **W7: charter a separate initiative from the owner-set scope.**

---

## PU-15 · OPS · domain mailboxes — ALL `@thedisciplineprogram.com` addresses

Owner-side infra (mail provider). Expanded 27.07: not just `head-coach@` — **every mail address the system uses moves to the domain** (head-coach@, plus the From/Reply-To the transactional sender uses). Not code; listed so it doesn't get lost. Once live → set `EMAIL_FROM`/`EMAIL_REPLY_TO` accordingly (couples with PU-11 env verification and PU-17 sender identity).

---

## PU-16 · CLOSED (27.07) · platform — "на сайті є, але без тих змін шо були" (Stas, 16.07)

Resolved by the owner: Denys had simply not published the plan — one publish cured everything; no platform staleness existed. **CLOSED, no code action.** The systemic guard against recurrence is PU-08/MP-22 (per-link publish status).

---

## PU-17 · FEATURE (S/M) · email — template redesign (Claude Design pass)

**Ask (owner, 27.07).** The transactional email templates are generic ("сейчас они дженерик") — polish them as part of the notifications wave; explicitly a Claude Design job.

**Grounding.** Templates live in `packages/email/src/templates/` (e.g. `lead-notification.tsx`), rendered through the Resend sender (`email-sender.ts:67-97`); invite + password-reset mails ride the same path (`users-admin.ts:213`). Scope at design time: a shared branded layout (logo, palette, typography consistent with the marketing site), per-template polish (lead notification, contact notification once PU-11 lands it, invite, password reset), plain-text fallbacks. **Sequence: after PU-11** so the design pass covers the full template inventory at once; sender identity depends on PU-15 (domain mailboxes).

**Verify after.** Test sends of every template render correctly (Gmail web/mobile at minimum); From/Reply-To use `@thedisciplineprogram.com` addresses once PU-15 lands.

---

## Non-items (dispositioned)

- **Legacy iOS app rejects platform creds** — by design (separate auth domain); unification = MP-NORTH-STAR. Explain to testers, no code.
- **Live social content on the site** — content production (Denys), not code. Revisit only if an embed feature is explicitly requested.
- **TikTok link 18.07** — DROPPED (owner 27.07): accidental paste, unrelated to the project.
