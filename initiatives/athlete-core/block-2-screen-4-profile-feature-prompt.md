# athlete-core — block 2, screen 4 (Athlete Profile) — `/feature` (small) prompt

**For the executor session.** The athlete's **Profile** screen — he edits his bodyweight and sees/manages his remembered profile picks (and whatever else the prototype shows, all backed by the existing profile contract). This is **pre-launch scope item #2** (`docs/roadmap.md`, Block 1) and **block-2 screen 4** of the athlete-core initiative.

This is the **lightest screen** of the four: the read + write are ALREADY shipped (the `useAthleteProfile` query + the `useUpdateAthleteProfile` optimistic mutation + the `/api/platform/athlete/profile` GET/PUT endpoint + the full `athleteProfileSchema` contract — all live from screen 2). **This slice is UI + route-swap — NO new endpoint, NO contract change, NO Prisma change.** Wrap via **`/feature` (small)**; escalate to full at Gate A ONLY if the no-profile-yet edge (below) is resolved with a server change.

---

## 0. Two SSOTs — visual language vs domain data (governs the whole build)

- **The Claude Design prototype is the SSOT for the VISUAL LANGUAGE only** — layout, density, component vocabulary, rhythm, color semantics, typography, the look of a profile field / pick chip / section. Reproduce it faithfully, **native** (MUI 7 + `@repo/ui` + theme tokens; **NO hex, NO transplanted HTML/CSS**). Consistent with the shipped athlete screens (Timetable + Session + Records).
- **Our contracts + `decisions.md` are the SSOT for the DOMAIN & DATA** — which fields exist (the profile model has EXACTLY: gender, heightCm, weightKg, healthStatus, healthNote, profileSelections), what a "pick" is, what values are knowable.
- **Conflict rule:** where the prototype shows data the domain doesn't have, **THE DOMAIN MODEL WINS** — render what the contract supports in the prototype's idiom; flag the gap at acceptance. Never fabricate a field or a canonical value list the model lacks (see §3 the profileSelections honesty rule). Never drop a contract field the prototype clearly shows.

---

## 1. The design

Connect the `claude_design` MCP connector (`https://api.anthropic.com/v1/design/mcp`) — if it needs authorization, run `/design-login` (adds `user:design:read/write`). Then import the project and read **`Athlete Profile.dc.html`**:
`https://claude.ai/design/p/6540df99-f793-4f6c-beeb-2d1963cac094?file=Athlete+Profile.dc.html`

Implement it **visually faithfully but native** (MUI + `@repo/ui` + theme tokens). Owner does a side-by-side walkthrough vs the prototype at acceptance (visual fidelity is a gate) AND checks every domain state works on real data (domain completeness is the other gate).

---

## 2. What this slice is

The athlete opens **Profile** (`/athlete/profile`, currently a "Coming soon" placeholder) and manages his own profile: **edits his bodyweight** (the mandatory field per the roadmap), **sees and clears his remembered profile picks**, and edits whatever other profile fields the prototype surfaces (gender / height / health status + note — all already in the contract). Optimistic, mobile-first. This is the athlete editing **his own** profile (not the coach editing it).

---

## 3. Read FIRST — verbatim anchors (quoted from current `main`)

### 3.1 The profile model + contract (ALL of it — no field exists beyond this)

```
// prisma model AthleteProfile (schema.prisma ~49) — @@map app_athlete_profiles
{ id, userId @unique, gender Gender?, heightCm Int?, weightKg Decimal(5,2)?,
  profileSelections Json?, healthStatus HealthStatus @default(HEALTHY), healthNote String?, createdAt, updatedAt }

// contracts/coaching/athlete-profile/athlete-profile.schema.ts
athleteProfileSchema = { id, userId, gender: Gender|null, heightCm: int>0 ≤300 |null,
  weightKg: number>0 ≤500 |null, healthStatus, healthNote: string|null,
  profileSelections: Record<string,string>|null, createdAt, updatedAt }
updateAthleteProfileSchema = { gender?, heightCm?, weightKg?, healthStatus?, healthNote?(nullable), profileSelections? }  // all optional (PATCH-style)
profileSelectionsSchema = z.record(string.trim.min(1), string.trim.min(1))   // FREE-STRING key -> value

// constants: MAX_HEIGHT_CM 300, MAX_WEIGHT_KG 500, MAX_HEALTH_NOTE_LENGTH 2000
// Gender = MALE|FEMALE (+ GENDER_LABELS) ; HealthStatus = HEALTHY|INJURED|RESTRICTED (+ HEALTH_STATUS_LABELS)
```

### 3.2 The read + write are ALREADY shipped — REUSE them (no new endpoint/contract/hook)

```
// apps/platform/src/lib/hooks/use-athlete-profile.ts
useAthleteProfile()        -> useQuery GET   (platformKeys.athleteProfile.data())
useUpdateAthleteProfile()  -> useOptimisticMutation PUT  (transform applyAthleteProfileUpdate, invalidates the same key)
//   applyAthleteProfileUpdate already merges every field (gender/heightCm/weightKg/healthStatus/healthNote/profileSelections)
// apps/platform/src/lib/api/endpoints/athlete-profile.ts
get()        -> GET  /api/platform/athlete/profile
update(data) -> PUT  /api/platform/athlete/profile
// api-server endpoints/coaching/athlete-profile.ts
coachingAthleteProfileApi.get(userId)    -> findOrThrow (NotFound if no row — see §3.4)
coachingAthleteProfileApi.upsert(userId,data) -> upsert (CREATES the row on first write)
```

### 3.3 The remembered-picks idiom to mirror (screen 2)

```
// apps/platform/src/modules/athlete-session/components/inline-profile-picker.tsx + profile-option-button.tsx
//   selections: Record<string,string>; renders per-axis ProfileOptionButton, isActive = selections[axis.name] === value, onPick(...)
//   shared display consts in athlete-session/utils/athlete-session.constants.ts (FONT_WEIGHT_DISPLAY, etc.)
```

On the **session view** the athlete picks a byProfile cell IN CONTEXT (the axis + its valid values come from that load). The **profile screen** is the OVERVIEW of the accumulated `profileSelections` map.

### 3.4 The no-profile-yet edge (MUST handle)

A fresh athlete may have **no `AthleteProfile` row** → `coachingAthleteProfileApi.get` does `findOrThrow` → **404**. (`db:seed` creates profiles for seeded users, but a freshly-invited real athlete who has never picked a profile or set bodyweight has no row.) The screen MUST treat a missing profile as an **empty, editable form**; the **first save upserts** the row. **Default: handle the 404-as-empty on the client (keeps this a UI-only slice).** Alternative (escalates to full): make the GET return a default-empty profile server-side — only if the prototype hard-assumes a profile always exists. Pick the client path unless Gate A says otherwise.

### 3.5 Patterns to mirror

`(secondary)` padded `AthleteShell` (D-SD-ROUTE-PADDED — profile is a focused content page, not full-bleed). Optimistic write already wired (`useUpdateAthleteProfile`). Floating labels everywhere (`mui-floating-labels-everywhere` — MUI `TextField`/`Select` `label` prop, never a hand-written caption). One component per file. Theme tokens only. Tz-stable dates (D-SD-DATES) IF any date is shown (likely none).

---

## 4. Scope (the vertical slice)

### A. [UI] The profile module — `apps/platform/src/modules/athlete-profile/`

One component per file, `@repo/ui` + MUI + tokens, reusing the EXISTING `useAthleteProfile` + `useUpdateAthleteProfile`. **Mandatory domain coverage (§0):**

- **Bodyweight edit** (`weightKg`) — the roadmap-mandated field. Number input (floating label), `> 0`, `≤ MAX_WEIGHT_KG` (500), optimistic save. Empty state when unset.
- **The other contract fields the prototype shows** — `gender` (MALE/FEMALE select, `GENDER_LABELS`), `heightCm` (int, ≤300), `healthStatus` (HEALTHY/INJURED/RESTRICTED, `HEALTH_STATUS_LABELS`), `healthNote` (≤2000, nullable). Build each ONLY as the prototype surfaces it, all via `updateAthleteProfileSchema`. No new fields.
- **Remembered profile picks** (`profileSelections`) — render the accumulated `{axis -> value}` pairs; allow **clearing** a pick (remove the key → next session view re-prompts). See §3 honesty rule.
- **Empty states** — no profile yet (the §3.4 fresh-athlete case → blank editable form), no picks yet.

### B. [ROUTE] Swap the placeholder

Replace the `/athlete/profile` "Coming soon" placeholder (`app/athlete/(secondary)/profile/page.tsx`) with the real screen, in the `(secondary)` padded `AthleteShell`.

---

## 5. Sacred / constraints + build decisions (ratified)

- **D-PROF-UI-ONLY** — UI + route-swap on the EXISTING contract / hooks / endpoint. **NO new endpoint, NO contract change, NO Prisma change.** The ONLY possible server touch is the §3.4 GET-404 default (escalates to full) — prefer the client 404-as-empty path.
- **D-PROF-SELECTIONS-HONEST** — `profileSelections` is a FREE-STRING `{axis: value}` map with **no canonical value catalog yet** (D-PROFILE-SELECTIONS; the profile-type catalog is the deferred library wave). The profile screen shows the remembered picks and supports **clear/remove**; it does **NOT** fabricate a curated axis/value picker (the valid values live in plan byProfile loads, not the profile). **Free-text re-entry is discouraged** — a typo ("Rx" vs "RX") silently breaks load resolution; prefer clear-here + re-pick-on-session. If the prototype shows a curated picker, honor the visual but flag "needs the profile-type catalog" at acceptance — DON'T invent the catalog.
- **D-PROF-FIELDS** — cover exactly the fields in `updateAthleteProfileSchema` the prototype shows; bodyweight is mandatory. No invented fields (no avatar/records/1RM editing here — see §6).
- **D-PROF-ROUTE-PADDED** — stays under `(secondary)` padded `AthleteShell` (D-SD-ROUTE-PADDED).
- **Theme tokens only — no hex, no transplanted HTML** (`no-hex-outside-theme`, `pattern-compliance`). **Floating labels everywhere. One component per file. Mobile-first.**
- **Optimistic** — reuse `useUpdateAthleteProfile` (already optimistic + invalidating); don't hand-roll mutation state.

---

## 6. Out of scope (other waves — do NOT build here)

- **1RM / benchmark records** — that's screen 3 (Records / PR-history). The profile may LINK to records if the prototype shows it, but does NOT own 1RM/benchmark CRUD here.
- **Profile-type catalog** (canonical axis/value lists for picks) — the deferred library wave; free-string picks + clear suffice here.
- **Coach editing the athlete's profile** — this screen is athlete self-edit only.
- **% of bodyweight** load reference (post-launch, D-AC-BODYWEIGHT-LABEL) — bodyweight here is just the athlete's attribute; it does not become a load prescription.
- **Avatar / account/auth fields** (email, password) — unless the prototype shows them AND a contract field backs them; flag if the prototype implies a field the model lacks.

---

## 7. Acceptance

- The athlete opens `/athlete/profile` on REAL data: edits bodyweight (persists, optimistic), sees his remembered profile picks, can clear a pick (it re-prompts on the next session view), and edits any other prototype-shown contract field.
- **The fresh-athlete no-profile case works** (§3.4) — empty editable form, first save upserts the row, no crash on the GET 404.
- Every prototype-shown field is backed by `updateAthleteProfileSchema`; **bodyweight is present and bounded** (>0, ≤500). `profileSelections` is honest (no fabricated catalog).
- Owner side-by-side walkthrough: visual fidelity holds AND every domain state works on real data.
- `check-types`, `lint`, `pnpm dep:check` clean. If the slice stays UI-only (the client 404 path), the gated api-server suite is untouched — note that in the PR. Close-out docs land **in** the feature PR (`closeout-before-pr`).

---

## 8. Process

`/feature` (small; escalate to full ONLY if §3.4 is resolved with a server change). `db:reset` world, no migration files (no schema change). Orchestrator reviews every implement wave via `git diff` (never agent self-report). Ratify any new build decisions into `decisions.md`; land the close-out IN the feature PR. ≤1 full (or ≤2 small) `/feature` per session.
