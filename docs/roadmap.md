# Roadmap — the-discipline-program

## Preamble

**Это ориентир, не контракт.** Сроков здесь нет намеренно — есть **путь** и **acceptance criteria** для каждой фазы, чтобы не вылизывать кнопку три года и одновременно не сдавать сырой product. Фазы могут добавляться, переписываться, схлопываться или дропаться по мере того как мы:

1. Получаем фидбек от Дениса в coach walkthrough'ах (`[[coach-walkthrough-gate]]`)
2. Сталкиваемся с reality в имплементации
3. Меняем понимание scope'а

**Документ живой.** Любая phase'а внутри может разрастись (или ужаться) в подзадачи; sequencing между фазами тоже не зацементирован. Если что-то меняется существенно — фиксируем в §"Roadmap decision log" внизу с датой и rationale.

**Context:** tool-for-friend для CrossFit-тренера Дениса (см. [`personas/denys.md`](personas/denys.md)). Single-tenant. Decisions arbiter = Денис; этот roadmap — мой и Максима путь к точке "Денис может пользоваться этим вместо Excel+Telegram+plain-text app".

**Cross-references:**

- [`personas/denys.md`](personas/denys.md) — POV-линза, train metaphor, founder principles
- Memory: `[[denys-coach-profile]]`, `[[plan-as-train-principle]]`, `[[coach-pov-first]]`, `[[ui-first-for-training-domain]]`, `[[coach-walkthrough-gate]]`, `[[training-domain-validation-gate]]`
- [`adr/`](adr/) — formal architectural decisions (ADR-0011 auth split, ADR-0014 payment provider — pending re-decision, ADR-0019 migrations, ADR-0021 architectural risks)

---

## Current state snapshot

| Область                          | Готовность  | Главное                                                                                                                  |
| -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Training-domain (coach planning) | ~75%        | Plan→Week→Day→Session→Block production-quality. Schema/Row backend ведётся. Step 8.4 = first coach-visible Schema editor |
| `/coach/athletes`                | ~50%        | Vertical готов, derived fields hardcoded (`activePlans=[]`, `lastActivityDate=null`)                                     |
| Coach profile                    | ~10%        | Page stub. Schema anemic (только bio)                                                                                    |
| Athlete-side platform            | ~5%         | Stubs "Coming soon"                                                                                                      |
| Records / benchmarks / analytics | ~5%         | OneRMRecord singleton; named WODs greenfield                                                                             |
| Subscription / payment           | ~15%        | Schema pre-shaped, 0 adapter, ADR-0014 pending re-decision                                                               |
| Auth + invitation                | ~85% / ~60% | Full vertical. Нет forgot-password, нет profile completion onboarding                                                    |
| Email pipeline                   | ~30%        | Resend wired, 1 template (invitation)                                                                                    |
| Marketing app                    | ~70%        | Public pages, contact form. Без signup/pricing CTA                                                                       |
| Admin app                        | ~80%        | Full CRUD + CMS + catalogs                                                                                               |
| Infrastructure                   | ~50%        | 3 Vercel projects, env vars missing, domain не подключён                                                                 |
| CI/CD                            | ~85%        | 6-job pipeline, husky robust                                                                                             |

---

## Phase 0 — Training-domain (current, in-progress)

> ⚠️ **Plan-content scope superseded 2026-06-02 — see the decision log (§2026-06-02) + ADR-0037.** The "all 34 archetypeParams формы hand-rolled", ArchetypePicker, and "9 row variants hand-rolled" items below are replaced by the compose-only constructor (tracked in `initiatives/plan-editor-compose/`). The Plan / Week / Day / Session / Block + SchemaRow + value-object work stands.

**Goal:** Coach может полностью спроектировать тренировочный план end-to-end, end-to-end persistence, готовность к coach UAT walkthrough.

**Scope (in):**

- Plan / Week / Day / Session / Block: UI + backend + tests (большая часть done через Step 1–7.5)
- Schema / SchemaRow / AlternatingGroup: backend через Step 8.0a/8.0b/8.1a/8.1b/8.1c/8.1d, HTTP routes Step 8.2, client hooks Step 8.3, partial-uniques Step 8.3.6/8.3.7
- ArchetypePicker UI + **все 34 archetypeParams формы hand-rolled** (per analysis/, юзеровская decision D3)
- SchemaRow editor: **все 9 row variants hand-rolled** + все composite VOs (Load / RepNotation / Intensity / Tempo / Side / Media / CompoundRep)
- Exercise catalog admin: done (Step 3)
- Label catalog admin + platform search: done (Step 4)
- Coach walkthrough интегрирован в каждый thesis (`[[coach-walkthrough-gate]]`)

**Scope (out):**

- Athlete-side execution (Phase 4)
- Records / analytics (Phase 4)

**Acceptance criteria:**

1. Coach создаёт plan в `/coach/plans`, видит status chip, edit name/description
2. Week navigation prev/next/today/jump-to-date
3. Day rows fix Mon-Sun, lazy materialization on first write, label + notes
4. Sessions CRUD + dnd-kit reorder + label + notes
5. Blocks CRUD + multi-label + Intensity (5 switches: effort/RPE/pace/HR/numericPace) + TimeCap composite
6. Schema editor: archetype picker (34 options), **per-archetype hand-rolled form для каждого**
7. SchemaRow editor: **9 row-kind forms hand-rolled**, composite VOs reusable
8. Schema/Row reorder с partial-unique constraints + 2-pass staging (P2034 retry surface)
9. Persistence end-to-end: logout/refresh ничего не теряет, concurrent edits surface understandable error
10. Coach walkthrough thesis present для каждого step starting Step 8.1c

**Dependencies:** analysis/ done (Phase 1–6 ratified)

**Risks:**

- 34 hand-rolled forms = много sub-steps (значительно больше чем сейчас в queue, который assumes "4 priority + fallback"). Реализуем full per юзеровской decision — будет пропорционально дольше
- 9 SchemaRow variants × 7 composite VOs = ~25+ form combos = отдельная phase внутри Step 9
- Pre-existing flake QA-023 в `block/admin.test.ts:406` — может стрелять на CI
- Seed sparsity: текущий seed создаёт plans без Sessions/Blocks/Schemas → smoke-tests зависят от manual creation. Сидируем 2-3 weeks из `analysis/source/sheets/` до coach walkthrough.

---

## Phase 1 — Coach UAT loop

**Goal:** Validate coach-side end-to-end before athlete-side investment.

**Scope (in):**

- Максимовский self-UAT (5-летний coaching опыт как secondary filter)
- Walkthrough с Денисом (screen-share, ~30-60 минут), fill `personas/denys.md §10 Decisions log` verbatim
- Iteration based на findings: critical → fix; non-critical → defer with rationale

**Scope (out):**

- New domain entities (только poliсhing existing)

**Acceptance criteria:**

1. Максим completes self-UAT pass: documented issue list (severity tagged)
2. Денис screen-share session: ≥3 decisions log entries в `personas/denys.md §10`
3. Critical issues (block daily-workflow) resolved
4. Non-critical issues postponed с rationale в `Open questions §9` или этот roadmap §"decision log"
5. Денис says "I would actually use this for [X] athletes" (verbatim quote captured)

**Dependencies:** Phase 0 acceptance

**Risks:**

- Денис может потребовать significant rework → loop обратно в Phase 0 (это **намеренный** возможный outcome — `[[training-domain-validation-gate]]` именно для этого)
- Edge cases plan-as-train (см. F1/F2/F3 из §"Open questions") решаются именно здесь

---

## Phase 2 — Coach profile / settings

**Goal:** Coach customizes own profile, не stub.

**Scope (in):**

- Form с полями: `bio`, `displayName`, `businessName`, `timezone`, social handles (Instagram / Telegram минимум — он active в обоих), `avatarBlobUrl`
- Schema extensions to `CoachProfile`: добавить `displayName`, `businessName`, `timezone`, `socialHandles JSONB`, `avatarBlobUrl`
- Avatar upload via Vercel Blob ([[image-upload-existing-flow]] / ADR-0013)
- Timezone populates `User.timezone`

**Scope (out):**

- Default equipment / rest / cap presets (юзер confirmed — не в MVP)
- Multi-tab settings page (single form достаточно)

**Acceptance criteria:**

1. `/coach/profile` form renders, persists all fields
2. Avatar upload через Vercel Blob working, image displays in coach drawer и athlete plan view
3. Timezone selection (IANA list) saves to `User.timezone`
4. Social handles validated (Instagram regex, Telegram @ handle)

**Dependencies:** существующий CoachProfile model, Vercel Blob уже wired

**Risks:** anemic schema extension может потребовать migration в Phase 7 (production). Сейчас dev DB → db:reset OK.

---

## Phase 3 — Email + auth completeness (foundation для Phase 4-5)

**Goal:** Lifecycle infrastructure готов к real onboarding (athletes + payments).

**Scope (in):**

- **Forgot-password flow:** UI form + endpoint + email template + token table (parallel to UserInviteToken)
- **Session revocation:** logout bumps `tokenVersion` (field уже в schema, нужно wire в logout handler + JWT callback verification)
- **Onboarding personalization:** invitation email включает coach display name + branding; consume page приветствует "Welcome from coach [Name]"
- **Profile completion screen:** optional post-invite step для athlete — height/weight/age/gender/healthStatus/healthNote. "Skip / fill later" path.
- **First-admin bootstrap:** documented procedure или `scripts/bootstrap-admin.mjs`
- **Email templates** (~6 шт. финально):
  - `invitation` (refresh с coach branding)
  - `password-reset` (new)
  - `plan-assigned` (new)
  - `payment-receipt` (new — wired в Phase 5)
  - `subscription-past-due` (new — wired в Phase 5)
  - `weekly-summary` (new — fan-out, нужен queue adapter)
- **Bounce webhook handler:** `/api/webhooks/resend` — mark email as undeliverable, admin signal
- **Queue adapter:** Inngest (рекомендация audit) для fan-out weekly summary

**Scope (out):**

- MFA
- Telegram notifications (юзер сказал skip)
- Per-email rate limit (security, не lifecycle — defer to Phase 7 hardening)

**Acceptance criteria:**

1. User can self-recover via "forgot password" → email arrives → reset works → login works
2. Logout invalidates JWT (tokenVersion bump verified в integration test)
3. Athlete invitation email содержит coach display name + avatar
4. Athlete после invite consume лендит на profile completion (skip-able)
5. 6 email templates render correctly (snapshot tests)
6. Bounce webhook receives Resend test bounce → User marked
7. Weekly summary sends to N athletes без блокирования request thread (Inngest fan-out)
8. First-admin bootstrap procedure documented в `docs/runbooks/`

**Dependencies:** Resend / react-email уже wired

**Risks:**

- Inngest setup overhead (or alternative async adapter)
- Bounce webhook signature verification edge cases

---

## Phase 4 — Athlete platform foundation

**Goal:** Athlete-side functional (view + log + records); coach `/athletes` gets real derived data.

**Scope (in):**

### 4.1 Athlete plan view

- `/athlete/plan` — current week, today's session, plan history
- Read-only view атлетового plan (что coach запрограммировал)
- Plan history list (предыдущие weeks)

### 4.2 Result logging (post-workout, no in-workout timers)

- `PerformedSession` contracts + endpoints + UI
- `PerformedExerciseInstance` contracts + endpoints
- **Per-archetype score-type discriminated union** (mini analysis-cycle): `time | rounds_reps | weight | reps`
- UI form per archetype family для post-workout entry
- "Mark session as done" + score capture per row

### 4.3 OneRMRecord history-by-default

- Append-only `OneRMHistory` table (per юзеровской decision A3)
- `OneRMRecord` becomes derived (latest from history) или сохраняется как cache
- ADR: history-by-default invariant

### 4.4 Benchmark catalog + results

- New entity `Benchmark` (canonical named WODs) — seed Girls (Fran/Grace/Helen/Diane/Cindy/Annie/Karen/Nancy/Eva/Linda/Mary/Amanda/Angie/Barbara/Chelsea) + Heroes (Murph/JT/Daniel/DT/Michael) + Open WODs (минимум 5)
- New entity `BenchmarkResult` с polymorphic `scoreValue JSONB` (per scoreType)
- Athlete logs Fran twice → progress/regress visible (Денис-quoted use case)
- Coach view: benchmark history per athlete

### 4.5 Records view (athlete + coach)

- Athlete `/athlete/records`: per-exercise PR history, per-benchmark progress
- **1 PR-over-time chart per exercise** (per юзеровской decision A4 = tier B analytics)
- Coach analytics tab в athlete detail drawer

### 4.6 Coach `/athletes` derived fields wire-up

**Critical для MVP** (per моей "as-Denis" decision D1):

- `activePlans` joined from PlanEnrollment.status=ACTIVE
- `lastActivityDate` / `daysSinceLastActivity` from PerformedSession.completedAt MAX
- `processStatus` (3-bucket: onTrack / steady / fallingBehind) derived from adherence formula
- `consistency.missedThisWeek` (input для action items)

**Nice-to-have для MVP:**

- `consistency.adherenceRate4w`
- `consistency.currentStreak`

**v1.1:**

- `nextWorkout` (derive on-demand)

### 4.7 Coach action items reconciliation cron

- ADR-0021 Tier 1 §3: queue/cron job для MISSED_WORKOUTS / HEALTH_REPORT items reconcile
- Runs daily, не sync в dashboard read

**Scope (out):**

- In-workout / gym-floor UX (timers / offline / PWA) — **v1.1**
- Advanced analytics (volume distribution, intensity histograms, training load curves) — **v1.1**
- Adaptive military-rehab specific UI track — **v1.1**

**Acceptance criteria:**

1. Athlete видит current week + today's session в `/athlete/plan`
2. Athlete logs result post-workout (per-archetype form), persists
3. OneRMRecord auto-updates с history preservation; old PR not overwritten
4. Benchmark catalog seeded с ≥25 named WODs
5. Athlete logs Fran twice — UI shows progress/regress comparison (Денис-cited use case)
6. PR-over-time chart renders для exercise с ≥3 records
7. Coach `/athletes` page shows real `activePlans` / `lastActivityDate` / `processStatus` / `consistency.missedThisWeek`
8. Coach can sort by `processStatus` (critical sortable signal на >100 атлетах)
9. Action items reconcile job runs nightly без manual trigger

**Dependencies:** Phase 0 (training-domain stable) + Phase 1 (UAT validated coach side)

**Risks:**

- Per-archetype score-type = new design axis. Discriminated union mirroring archetype-params spec (~Phase 4-6 analysis worth). Mini analysis-cycle нужен **до** writing contracts.
- Benchmark catalog не pre-analyzed — нужен small analysis-cycle (~3-5 sheets worth) before code.
- PerformedSession endpoints — semantic mismatch с admin-CRUD pattern ([[discuss-before-lift-and-shift]]).

---

## Phase 5 — Subscription & access control

**Goal:** Monetization + plan-as-train operational.

**Scope (in):**

- **Subscription model:** 30-day calendar window (per Денис F1: купил 12-го → access до 11-го следующего месяца включительно). Decoupled от plan timetable: plan продолжает идти, athlete consumes whatever plan content available within subscription window.
- **Payment provider:** ADR-0014 superseded **at implementation time** (per юзеровской decision B1 — provider choice откладывается на момент имплементации этой phase'ы). Likely candidates: LiqPay / WayForPay / Monobank Acquiring.
- `PaymentPort` adapter implementation (provider-specific)
- Webhook handler `/api/webhooks/<provider>`: signature verify + idempotency via `RequestIdempotency` table (ADR-0036)
- Subscription FSM: TRIAL → ACTIVE → PAST_DUE/grace → CANCELED
- **Plan-as-train coupling:**
  - Subscription state → `PlanEnrollment.status` invariant (CANCELED → REMOVED)
  - Athlete history preserved when CANCELED (per F3) — `PlanEnrollment.deletedAt` или soft-status pattern
  - Re-subscribe → athlete видит свою old history + boards current plan
- **Pause status:** schema preserved (`PAUSED` enum уже есть). UI deferred per F2.
- Checkout flow (provider-hosted page redirect) + subscription management UI в `/athlete/billing`
- Marketing pricing page (basic; minimum signup CTA → invite-only nudge)
- Access middleware: PAST_DUE + `graceEndsAt < now` → block athlete content
- Subscription↔PlanEnrollment cross-aggregate tx invariant (ADR)

**Scope (out):**

- Multi-currency (UAH primary, USD optional — provider-dependent)
- Subscription tiers / pricing tables (single tier для MVP)
- Affiliate / referral
- Stripe (поскольку Денис UA-resident — practically infeasible without overhead)

**Acceptance criteria:**

1. ADR-0014 superseded с chosen provider, rationale documented
2. `PaymentPort` adapter implemented, integration tested с provider sandbox
3. Webhook handler: signature verified, idempotent (replay same event → no-op)
4. Real test athlete pays через UI → subscription = ACTIVE → access content visible
5. Subscription canceled → `PlanEnrollment.status = REMOVED` automatically, history preserved
6. Athlete re-subscribes → sees old PR history, plan history, joins current plan from next valid day
7. PAST_DUE state: athlete gets email (`subscription-past-due` template); graceEndsAt < now → access blocked
8. Subscription FSM transitions tested end-to-end (unit + integration)

**Dependencies:** Phase 4 (athletes exist, plans assigned, history accumulated)

**Risks:**

- UA payment provider edge cases (recurring subscription semantics vary)
- Schema migration `stripeProductId` → `providerProductId` (rename rolled up в provider-decision PR)
- Cross-aggregate tx (Subscription + PlanEnrollment) silent corruption risk if invariant fails

---

## Phase 6 — Production deploy + security hardening

**Goal:** Actually live, real domain, monitored, secure-enough.

**Scope (in):**

### 6.1 Domain + subdomains

- `X` — marketing (root)
- `admin.X` — admin app
- `app.X` — platform app (per юзеровской decision G1: либо `app` либо `platform`, выбрал `app` короче)
- robots.txt / sitemap updated
- NEXTAUTH_URL canonical per app
- CSP allowed origins updated

### 6.2 Database production

- `prisma migrate dev --name init` baseline (per G2 — миграции **здесь**, не раньше)
- Commit migrations folder
- Switch scripts: `db:push` → `prisma migrate deploy`
- ADR-0019 §1, §5 resolved
- Neon production tier с PITR enabled (Launch tier $19/mo)
- Pooler URL for apps, direct URL for Prisma CLI (env-aware)
- Manual snapshot ritual в runbook

### 6.3 Env vars в Vercel

- DATABASE_URL (pooler), NEXTAUTH_SECRET (32+ chars), NEXTAUTH_URL per app
- NEXT*PUBLIC*\*\_URL (canonical hosts)
- BLOB_READ_WRITE_TOKEN (admin)
- **CRON_SECRET (add to .env.example first — текущий gap)**
- Sentry quartet (DSN, AUTH_TOKEN, ORG, PROJECT) per app
- Resend triplet (API_KEY, FROM, REPLY_TO)
- Upstash pair (URL, TOKEN)
- Provider keys (Phase 5 payment)

### 6.4 Monitoring (best-free per G3)

- Sentry free tier (5K errors/mo, уже wired)
- Source maps upload at build (`SENTRY_AUTH_TOKEN` set)
- Sentry alert rules: spike (>5 errors/min) → email
- BetterStack uptime free tier (10 monitors, 3-min check) на `/api/ready` всех 3 apps
- Axiom log shipping free tier (500GB/month ingest) replaces 1h Vercel retention
- Vercel Analytics + Speed Insights (free, уже wired)

### 6.5 CI/CD additions

- Dependabot weekly (security urgency=immediate)
- CodeQL workflow (free для repo)
- Vercel deploy gate (branch protection or ignored-build-step)
- Post-deploy smoke: `curl /api/ready && /api/version` в GitHub Action

### 6.6 Security hardening

- tokenVersion bump on logout уже в Phase 3 (cheap, big win)
- Privacy policy + cookie banner + GDPR consent (UA Law on PersData + military rehab клиенты = sensitive medical)
- Data deletion endpoint (right-to-erasure)
- Per-email login rate limit (deferred от Phase 3)
- Persdata audit log (basic — кто читал `AthleteProfile.healthNote`)

**Scope (out):**

- MFA
- Vault for secrets rotation (Doppler / 1Password)
- SLO/error budget formal definition (premature)

**Acceptance criteria:**

1. All 3 apps build green в Vercel Dashboard
2. `/api/health` + `/api/ready` + `/api/version` return 200 на live URLs (3 apps × 3 endpoints = 9 green)
3. Custom domain replaces `*.vercel.app` (robots.txt, sitemap, CSP, NEXTAUTH_URL)
4. Migrations committed, `prisma migrate deploy` runs in CI
5. Neon production DB live с PITR enabled; snapshot taken и restore tested
6. Sentry catches synthetic test error in prod → alert email arrives
7. BetterStack uptime monitor green for 24h continuous
8. Logs shipped to Axiom, queryable for ≥7 days
9. Dependabot creates first security PR
10. Privacy policy + cookie banner live на marketing
11. Forgot-password rate-limited (≤3 attempts / 15 min per email)
12. Data deletion endpoint works (test user → erased)

**Dependencies:** Phase 5 (full lifecycle ready)

**Risks:**

- DNS propagation delays
- NEXTAUTH_URL split footguns (cookie scope)
- Migrations switch — irreversible after first deploy

---

## Phase 7 — Launch + iterate

**Goal:** Денис реально использует. Production-real пользователи.

**Scope (in):**

- Bootstrap first admin (Maksim или Денис)
- Денис creates own coach profile + subscribes (или admin-comp)
- Денис invites первые 5-10 athletes через admin
- Athletes consume invites → fill profiles → subscribe (real payment, real money)
- Sentry / Axiom / uptime monitored 24/7 в первую неделю
- Hot-fix queue: критические баги → emergency PR + deploy
- Weekly debrief с Денисом

**Scope (out):**

- New features (только fixes + small polish)

**Acceptance criteria:**

1. ≥5 athletes active с paid subscriptions
2. ≥1 athlete logged real workout result (not synthetic test)
3. ≥1 athlete logged benchmark result, sees progress comparison
4. 0 critical Sentry errors в первые 7 days production
5. Денис verbatim quote: "we'll continue using this" в `personas/denys.md §10`

**Dependencies:** все предыдущие phases

**Risks:**

- Production-only bugs not caught in dev
- Real users discover edge cases we missed
- Payment provider production differs от sandbox

---

## Out of scope for MVP (v1.1+)

Эти items сознательно отложены. Не "забыли" — defer'ed с rationale.

| Item                                                                 | Rationale                                                                                                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gym-floor UX (PWA + timers + offline + per-archetype in-workout)** | Самостоятельный domain ~50% размера training-domain. Athlete logs results post-workout в MVP. (A1)                                                                                    |
| **Adaptive military-rehab specific UI**                              | Требует прямого разговора с Денисом про specifics (prosthetics tracking, PTSD-aware caps, banned movements). Generic adaptive покрыт через uже-domained modifications в Phase 0. (A6) |
| **Telegram notifications integration**                               | Email достаточен для MVP. Telegram bot — отдельный setup overhead. (A5)                                                                                                               |
| **Pause subscription UI**                                            | Schema preserved (`PAUSED` enum уже есть). UI решение откладывается. (F2)                                                                                                             |
| **Advanced analytics**                                               | Tier B (PR-over-time chart) в MVP достаточен. Volume/intensity histograms, training load curves — v1.1. (A4)                                                                          |
| **Multi-tenancy / public signup / discoverability**                  | Tool-for-friend single-tenant остаётся single-tenant в MVP                                                                                                                            |
| **Marketing storefront billing wiring**                              | Pricing page basic в Phase 5; полный e-commerce checkout flow не нужен                                                                                                                |
| **Excel data migration tooling**                                     | Денис starts fresh (per G4). Bootstrap manual через admin                                                                                                                             |
| **MFA, secrets vault, formal SLO**                                   | Premature для tool-for-friend MVP                                                                                                                                                     |
| **Stripe**                                                           | UA-резидент Дениса → operational pain. Phase 5 picks LiqPay/WayForPay/Monobank                                                                                                        |

---

## Open questions (defer to Coach UAT)

Эти решения нужны от Дениса, **не** мои предположения:

1. **F1 уточнение:** "30-day calendar window" — это **строго 30 дней от purchase date** или **calendar-month-boundary** (купил 12-го любого месяца → 11-го следующего)? Технически разница в feb/30/31-дневных месяцах. Default решение: 30 calendar days от purchase, рассчитывается per millisecond. Денис может откорректировать.

2. **F3 уточнение:** "athlete возвращается с сохранением истории" — после CANCELED athlete может re-subscribe в любой момент, или есть cooldown? Boards next valid plan day, или с понедельника?

3. **Pause window (F2 details):** "неделя раз в полгода" — это hard cap или soft suggestion? Что если athlete не использовал pause за полгода — accumulates? Resets?

4. **Benchmark catalog scope:** какие именно WODs Денис считает обязательными для MVP? Семена сделаем 25 канонических, но Денис может попросить добавить specific (Open WODs последних лет, или его own custom benchmarks).

5. **Military rehab edges:** какие modifications нужны (prosthetics, PTSD-aware caps, banned movements)? Это для v1.1, но capture'им сейчас в `personas/denys.md §7 Open questions`.

---

## Roadmap decision log

Append-only. Меняется roadmap-level scope/sequencing — фиксируем здесь.

### 2026-05-19 — Initial roadmap drafted

**Decisions captured:**

- A1: Gym-floor UX → v1.1
- A2: Benchmark catalog → MVP
- A3: OneRMRecord history-by-default
- A4: Analytics tier B (PR-over-time chart per exercise)
- A5: Telegram notifications → skip
- A6: Adaptive military-rehab UI → v1.1
- B1: Payment provider choice → defer to Phase 5 impl time
- B2: ADR-0014 supersede → at impl time, не upfront
- C1: Athlete-side MVP = view + result logging + benchmarks + 1RM history (option C)
- D1 (Claude as-Denis decision): critical derived fields = activePlans, lastActivityDate, processStatus, missedThisWeek; nice-to-have = adherenceRate4w, currentStreak; v1.1 = nextWorkout
- D2: Coach profile fields = bio + displayName + businessName + timezone + social handles + avatar (без equipment presets)
- D3: Schema editor full domain coverage (all 34 archetypes + 9 SchemaRow variants hand-rolled, no fallback)
- E1: Email templates MVP = invitation + password-reset + plan-assigned + payment-receipt + past-due + weekly-summary
- E2: Bounce webhook → MVP
- F1: Subscription = 30-day calendar window from purchase date
- F2: Pause status — schema preserved, UI deferred
- F3: CANCELED preserves history, athlete can re-subscribe with old data
- G1: Subdomains = `X` (marketing) + `admin.X` + `app.X`
- G2: Migrations switch at Phase 6, not earlier
- G3: Best-free monitoring stack (Sentry + BetterStack + Axiom)
- G4: Data migration — skipped (Денис starts fresh)
- H1: Single `docs/roadmap.md` file structure
- H2: Per-phase format with goal/scope/acceptance/dependencies/risks

**Rationale anchors:**

- Phase order optimizes coach-side stability before athlete-side investment ([[ui-first-for-training-domain]] sequencing)
- Coach UAT loop (Phase 1) gates everything downstream — может откатить Phase 0 если Денис fundamentally not happy
- Phase 5 (subscription) decoupled от plan timetable (per F1) → simple billing logic, complex plan logic uncoupled

### 2026-06-02 — Compose-only pivot (supersedes Phase 0 archetype scope)

**Decision (ADR-0037):** plan-content goes compose-only — the coach assembles workouts by freely nesting ~8 primitives (a Container with orthogonal `repetition`/`arrangement`/`scoring`/`rest` axes + Row leaves); "archetype" becomes an emergent, computed-on-read label, not a stored entity.

**Supersedes D3** ("all 34 archetypes + 9 SchemaRow variants hand-rolled, no fallback") and the Phase 0 scope lines for ArchetypePicker + the 34 hand-rolled `archetypeParams` forms. Cut: `model Archetype`, `Schema.archetypeId`, the 34-variant `archetypeParams` union, stored `kind`/`family`, the archetype contracts/endpoint/seed, the picker + ~18 per-archetype forms. Kept (sacred): Week/Day/Session/Block tree, recursion, SchemaRow + Json-VOs, Exercise/Label, Performed\*; the `step-09.x` SchemaRow editors survive.

**Rationale:** acceptance = expressiveness (any structure the coach writes composes by free nesting — verified against `analysis/source/`), not corpus coverage ("N archetypes"). The picker-first UX was the flee-to-Sheets risk. No users → no migration; blast radius (~50 files) sizes the workflow, not the decision.

**Deferred:** the scoring/execution layer (`scoring` axis present-but-inert) → separate later phase.

**Tracking:** `initiatives/plan-editor-compose/` (replaces `implementation/state/01-step-queue.md` for the plan-editor work; the two-session planner/executor workflow is dropped — see `initiatives/README.md`).

---

## How to use this document

- Перед началом любой phase'ы: re-read its section + cross-refs
- В конце phase'ы: walk through acceptance criteria checklist; tick all → "done"; missing → flag in `## Open questions` или fold в next phase
- Roadmap-level scope change → append in `## Roadmap decision log` (никаких rewrites без рационала)
- Phase-internal sub-step sequencing → лежит в `implementation/state/01-step-queue.md` (separate, granular)
