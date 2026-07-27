/fix admin users list breaks permanently after a soft delete; coach account shows user-mutation controls that always 403

## How to run this

**Run the standard `/fix` pipeline exactly as the skill prescribes** — investigation, finding, fix plan, the plan-approval gate, fix agents, review, verify, PR. Everything in this prompt is INPUT to that pipeline (evidence, scope boundaries, acceptance) — it does not replace or skip any stage, gate, task tracking, or artifact of the skill. One heads-up for the plan-approval gate: present the plan and wait — the owner takes it for an external tech-lead review before answering the gate question.

Initiative context: this batch is `post-uat` PU-06 (pick `post-uat` if the session-start hook asks). SSOT: `initiatives/post-uat/triage.md` § PU-06 and `decisions.md` D-2. The batch is the TWO findings below — out-of-scope discoveries go to `initiatives/post-uat/deferred.md` as notes, not into the diff.

## Finding 1 — the first successful user delete permanently 500s the admin users list

`deleteUser` soft-deletes: sets `deletedAt`, suffixes the email to `<email>_deleted_<ts>`, bumps `tokenVersion`. Every admin read path still returns soft-deleted rows, and the suffixed email fails `z.string().email()` in the response schemas → response validation throws on every subsequent list read. The operator now holds a real ADMIN account, so this is a live prod hazard.

Tech-lead recon evidence (a head start for your investigation — verify against the current tree, then use):

- `packages/api-server/src/endpoints/iam/users-admin.ts:35-41` — `getAll` has no `deletedAt` filter (delete impl + email suffix at `:156-174`).
- `packages/contracts/src/entities/iam/user/user.schema.ts:21` (and `:9`) — the strict `.email()` the suffixed address fails.
- `packages/api-routes/src/route-helpers.ts:39-47,69-79` — `parseResponse` → `InternalServerError` on response-schema failure.
- By-id detail read (`apps/admin/src/app/api/admin/users/[id]/route.ts` → the admin-user-view service) — the same 500 for a soft-deleted id.
- `packages/api-server/src/endpoints/cms/dashboard/admin.ts:107-108,128-131` — dashboard user counts + Recent Activity include soft-deleted users.
- The existing test hides the bug: `users-admin.test.ts:278-294` hard-deletes its row in cleanup and never re-reads the list.

Desired behavior: soft-deleted users disappear from ALL admin read paths — the users list, the by-id view (standard not-found), dashboard counts + Recent Activity — and a delete no longer degrades any screen.

## Finding 2 — HEAD_COACH sees user-mutation controls that always fail

`withAdminAuth` + the admin proxy admit HEAD_COACH into the console, but user update/role/delete are ADMIN-gated server-side (`requireAdminStrict`), so the coach account sees a Delete action and an editable form whose save always 403s. Evidence: delete action `apps/admin/src/modules/users/sections/users-list-section/index.tsx:158-162` (confirm modal `:212-222`), edit form `apps/admin/src/modules/users/components/user-form.tsx`; role available via the session.

Desired behavior: HEAD_COACH sessions see no user-mutation affordances (no delete action, non-submittable/read-only edit form); ADMIN sessions unchanged. The server-side guards stay exactly as they are — ratified D-2 (the two-account model): the strict guard is correct, only the UI lies.

## Scope boundaries (ratified — not negotiable within this batch)

- NO contract changes.
- Role guards and the pinned `users-admin-actor-role.test.ts` assertions stay untouched.
- api-server tests: run the touched test files in isolation against the dev DB; the full serial api-server suite only at your discretion (standing approval exists; ~10 min serial, live Neon dev).
- PR against `main` (`main` is PR-only). Suggested branch slug: `admin-soft-delete-reads`.

## Acceptance

- Dev: ADMIN deletes a user → the row disappears; list, by-id, dashboard all stay healthy; deleting another user still works.
- A HEAD_COACH session shows no user-mutation controls anywhere in Users.
- Tests prove both: an api-server test that soft-deletes then re-reads the list AND parses the response against `getUsersPageDataResponseSchema`; a UI test asserting the per-role affordances.
- check-types / lint / dep:check green.
