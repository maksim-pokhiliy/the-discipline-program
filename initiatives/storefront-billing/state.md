# storefront-billing — state (the board)

**Updated:** 2026-09-23 — **FOUNDED.** Two days of dialogue distilled: the Apple-vs-Mono debate settled by facts (every athlete is in Ukraine; 1.3% vs 15%; `4w` periods; no App Store listing), the domain model ratified by the owner («модель заходит»): subscription per product, product↔plan bindings with JOIN / COPY delivery, prices = amount + period + auto-renew, access resolved per enrollment in `authz/`, no pause, cash replaced by one-off periods, MANUAL only for comps and the cohort grant. Denys got two question packs (coach-side defaults D-11; FOP-side: he has NO mono business account yet, his accountant does not know the РРО nuance, all athletes are Ukrainian) and the P0–P4 dates. ADR-0044 drafted (supersedes ADR-0008 + ADR-0014). Work on the code starts 2026-09-24.

## Board

| #   | Phase           | Status     | Pointer                                                                                                  |
| --- | --------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| P0  | Foundation      | 🔵 active  | 0.1 ✅ (this PR) · 0.2 spike next · 0.3 migration · 0.4 `uk` pages · 0.5 env/port/adapter · target 02.10 |
| P1  | Core            | ⬜ pending | D-3 must be RATIFIED first (0.2) · target 09.10                                                          |
| P2  | Athlete         | ⬜ pending | target 16.10                                                                                             |
| P3  | Coach & admin   | ⬜ pending | target 23.10                                                                                             |
| P4  | Launch + cohort | ⬜ pending | gated by SB-5 (prod token) + SB-4 (requisites → acquiring approval) · target ~28.10                      |

## Next action

**▶ 0.2 Mono spike + 0.3 migration corpus (2026-09-24).** Owner: get a TEST token at `api.monobank.ua` (any mono client; no business account needed) and put it in the platform preview env as `MONOBANK_MERCHANT_TOKEN`; read/download the SB-1 pages in a browser and drop them in the scratchpad. Planner: write the 0.2 spike script (invoice → pay → webhook → tokenize → MIT charge → `subscription/create`), fold the payloads into `monobank-notes.md`, ratify D-3, then write the 0.3 corpus + executor prompt from `domain-model.md` (run the planner-discipline (h) trace on the new uniques before locking it). 0.4 and 0.5 can run as parallel executors once 0.3's schema is merged (0.4 does not depend on it at all).

## Open decisions awaiting ratification

- **D-3** — recurring mechanism (native Mono subscriptions vs own scheduler + tokenized merchant-initiated charges). Decided by the 0.2 spike. P1.3 must not be specced past it.

## Live carry-forwards

SB-1 (browser-only Mono docs + skill archive) · SB-2 (FOP terminal currency) · SB-3 (РРО — Denys) · SB-4 (requisites — Denys) · SB-5 (prod token — Denys) · SB-7 (roster projection, 3.2) · SB-8 (retire Stripe shapes, 0.3) · SB-9 (tax consequence — owner) · SB-10 (email language, before 1.3) · SB-11 (iOS athletes have no enrollment, 4.1) · SB-12 (newcomers + the app, rides on AS-1) · SB-13 (apex-sunset decommission runs in parallel, separate PRs).

## Gotchas a resuming session must know

- **The iOS shim is Billing-blind by dep-cruiser** (`api-server-mobile-compat-no-cms-billing`); so are LMS and Coaching. The ONLY door is `authz/` (`resolveEnrollmentAccess`, D-7). Do not add a Billing import anywhere else.
- **The app's wire traps are sacred** (apex-sunset charter): the soft wall is a normal 200 program DTO with text; never a new status, never `isRestDay:false` with a null program, never a link (Apple 3.1.1).
- **ADR-0008 (singleton subscription) and ADR-0014 (Stripe) are superseded by ADR-0044** — do not design around `userId @unique` or `stripe*` columns; the W0 migration removes them.
- **The roadmap's "second paying coach" trigger is superseded** by Denys's 2026-09-22 pull — do not re-litigate "billing is post-launch".
- **Existing iOS athletes have no `PlanEnrollment`** (SB-11): the gate must treat "no grant object" as OPEN until the 4.1 grant, or the cutover kicks everyone.
- **Denys has no mono business account yet** (SB-5): dev/preview run on the owner's test token; only P4 waits on him.
