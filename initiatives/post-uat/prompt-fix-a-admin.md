/fix admin users: exclude soft-deleted users from every admin read path + hide user-mutation controls from HEAD_COACH sessions

## Session setup

This session works the `post-uat` initiative — pick `post-uat` if the session-start hook asks. SSOT: `initiatives/post-uat/triage.md` § PU-06 and `decisions.md` D-2. Scope is FIXED — no self-expansion; anything discovered out of scope goes as a note into `initiatives/post-uat/deferred.md`, not into the diff.

## Context (verified root cause — do not re-derive)

`deleteUser` soft-deletes: sets `deletedAt`, suffixes email to `<email>_deleted_<ts>`, bumps `tokenVersion`. But every admin read path still returns soft-deleted rows, and the suffixed email fails `z.string().email()` in the response schemas → **the first successful delete permanently 500s the admin users list.** Anchors:

- `packages/api-server/src/endpoints/iam/users-admin.ts:35-41` — `getAll` has no `deletedAt` filter (delete impl + email suffix at `:156-174`).
- `packages/contracts/src/entities/iam/user/user.schema.ts:21` (and `:9`) — the strict `.email()` the suffixed address fails.
- `packages/api-routes/src/route-helpers.ts:39-47,69-79` — `parseResponse` → `InternalServerError` on response-schema failure.
- By-id detail read (`apps/admin/src/app/api/admin/users/[id]/route.ts` → the admin-user-view service) — same 500 for a soft-deleted id.
- `packages/api-server/src/endpoints/cms/dashboard/admin.ts:107-108,128-131` — dashboard user counts + Recent Activity include soft-deleted users.
- The existing test hides the bug: `users-admin.test.ts:278-294` hard-deletes its row in cleanup and never re-reads the list.

Denys operates a real ADMIN account since 27.07, so this is a live prod risk.

## Scope

1. **Exclude soft-deleted users from ALL admin read paths:** `getAll` (`where: { deletedAt: null }`), the by-id admin user view (soft-deleted id → the standard not-found path), dashboard user count + Recent Activity.
2. **Honest UI for the coach account (D-2 two-account model):** in `apps/admin`, HEAD_COACH sessions must not see user-mutation affordances that always 403 — hide the row delete action (`apps/admin/src/modules/users/sections/users-list-section/index.tsx:158-162`, confirm modal `:212-222`) and make the user edit form non-submittable/read-only for HEAD_COACH (`apps/admin/src/modules/users/components/user-form.tsx`). Role source: the session (`session.user.role`). `requireAdminStrict` and the role guards stay UNTOUCHED.
3. **Tests:** (a) api-server — soft-delete a user, then assert the users page-data EXCLUDES the row AND the response parses against `getUsersPageDataResponseSchema`; assert the by-id read returns not-found for the soft-deleted user. (b) admin UI — HEAD_COACH sees no delete/save affordances; ADMIN does.

## Constraints

- NO contract changes. NO changes to role guards or to the pinned `users-admin-actor-role.test.ts` assertions (D-2: the capability upgrade is dropped, not reworked).
- api-server tests: run the touched test files in isolation (vitest path filter against the dev DB). The full serial api-server suite only at your discretion — standing approval exists, but it is ~10 min serial on live Neon dev.
- Branch `fix/admin-soft-delete-reads`, PR against `main` (`main` is PR-only). Conventional commits, lowercase subjects, no comments in code, no AI trailers/signatures anywhere.

## Acceptance

- On dev: ADMIN deletes a user → the row disappears; list, detail, dashboard all stay healthy (no 500); deleting another user still works.
- A HEAD_COACH session shows no user-mutation controls anywhere in Users.
- check-types / lint / dep:check green; touched tests green.
