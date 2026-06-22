# profile-axis-catalog — state (the board)

**Updated:** 2026-06-22. **W1 (catalog + admin) SHIPPED via `/feature`** on `feat/profile-axis-catalog-w1` — `ProfileAxis` model + contract (`@repo/contracts/coaching/profile-axis`) + api-server CRUD (`profileAxisAdminApi`) + admin "Profile Axes" module + tests + docs, all green (check-types / lint / dep:check / admin build), reviewed + QA'd (0 code-defect CRITICALs; the contract dedup is POST-normalize, stronger than `load.ts`). Ratified D-4 (case-sensitive `key`, no `keyLower`) + D-5 (`coaching/` placement + file-precise dep-cruiser carve-out admitting the admin routes). **ONE mechanical step pending:** the Prisma migration file — `pnpm db:migrate --name add_profile_axes` needs `SHADOW_DATABASE_URL` (absent in local `.env`); until it lands the admin module 500s (P2021) on a fresh DB. The ontology stays RATIFIED (D-1/D-2); the sacred-VO change (D-3) is OPEN-gated to W2 — W1 touched NONE of it (zero load-VO/resolver/athlete-profile radius, git-verified).

## Board

| #   | Step                      | Status       | Pointer                                                                                                                                                                                                    |
| --- | ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Found + ontology lock     | ✅ done      | charter · decisions D-1/D-2/D-3 · journal 2026-06-22                                                                                                                                                       |
| 1   | Catalog + admin           | ✅ shipped\* | W1 on `feat/profile-axis-catalog-w1` (model+contract+endpoints+admin+carve-out+tests+docs); **\*migration `20260622113153_add_profile_axes` IN branch; PR #304 CLEAN/green — pending owner-smoke + merge** |
| 2   | Coach binding (sacred-VO) | ⬜ pending   | D-3 gate: plan-editor-compose decision + four-projection re-check FIRST                                                                                                                                    |
| 3   | Athlete two-layer profile | ⬜ pending   | curated picker + write-back by kind + selections migration                                                                                                                                                 |

## Next action

**▶ Owner: local smoke → merge PR #304 (CLEAN/green, migration in branch), then W2 — the next executor session.** W1 code is shipped + reviewed + tested on `feat/profile-axis-catalog-w1` (commits: founding · `feat(db)` model · `feat(contracts)` · `feat(api-server)` · `feat(admin)` + carve-out · `test(coaching)` · close-out docs). Remaining (owner-side): `pnpm db:reset` → owner-smoke on dev admin (port 3002 → Profile Axes → create `level` with `RX`/`SC`, edit, delete; dup-key → 409) → merge #304 (migration auto-applies to prod via `db-migrate.yml`; the PREVIEW DB has no auto-migrate, so Profile Axes 500s there until the schema is pushed) → gated api-server suite (~10 min) on your ok. **W2 (coach binding — sacred-VO, decision-first): its FIRST task is the plan-editor-compose ratification + four-projection re-check (D-3), BEFORE any byProfile-VO code.**

## Open decisions awaiting ratification

- **D-3** — byProfile axis → discriminated union (`catalog | human`). Owner-APPROVED in concept (2026-06-22); RATIFICATION GATE before W2 code: (1) add a cross-ref decision to `plan-editor-compose/decisions.md`, (2) run the four-projection re-check on the changed VO. **Do NOT touch the byProfile VO in W1.**

## Live carry-forwards (see deferred.md)

PAC-1 existing byProfile-load migration (W2) · PAC-2 `profileSelections` key migration (W3) · PAC-3 masters/age as a human attribute (default: custom axis) · PAC-4 `ProfileAxisValue` table (deferred — `String[]` now) · PAC-5 per-coach axis scoping (global now) · PAC-6 full-cartesian cells UX as axis-values grow · PAC-7 plan-editor-compose four-projection re-check + cross-ref decision (W2 gate) · **PAC-8 W2 validation-law reconciliation (catalog NFKC + case-sensitive `key` vs `load.ts`) · PAC-9 W2 axis-delete referential policy · PAC-10 future `library` bounded context (low) · PAC-11 `TagsInput` raw-vs-NFKC dedup mismatch (low)** — all new from W1 QA.

## Gotchas a resuming session must know

- **W1 must NOT touch the sacred `byProfile` load VO** — that's W2, gated on D-3 + a four-projection re-check in plan-editor-compose. W1 is the catalog table + admin CRUD only.
- **gender is NOT absorbed** (D-1) — it stays a typed column with 7 coach-facing read sites; the catalog holds training-classification axes ONLY. The human/training split IS the point.
- **The resolver never reads `ProfileAxis`** — resolution uses the load VO (axisId + cells) + the profile's selections; this keeps the lms→coaching boundary clean across W2/W3.
- **athlete-core's deferred profile-type catalog is PROMOTED here** — done in the founding commit (`athlete-core/deferred.md` library-wave row → "PROMOTED 2026-06-22"). The gender→resolver wiring (`D-FIELDS-GENDER-INERT`) + the curated-picker unblock move here too (W2/W3).
- **W1 migration is NOT authored yet** — `model ProfileAxis` is in `schema.prisma` + `db:generate`'d (so it type-checks green — the trap), but `prisma/migrations/` has no `*_add_profile_axes`. The admin module 500s (P2021 — `handlePrismaError` has no P2021 branch) until `pnpm db:migrate --name add_profile_axes` runs (needs `SHADOW_DATABASE_URL`). Do NOT read green check-types as "feature runnable."
