# Legacy mobile stack — verified REST contract (2026-06-25)

Source: full clones at `~/projects/contrib/tdp/mobile-backend` (Spring Boot 3 / Java 17 / Postgres) + `mobile-ios` (SwiftUI). Prod base URL hardcoded in the iOS app: `https://thedisciplineprogram.com/api/v1` (DEBUG → `/dev-api/v1`, a separate dev backend behind Caddy). Separate infra from our Neon.

> **✅ Verified live 2026-06-25** against the local harness (`tdp/local/`): `signin → POST /generalProgram (200) → GET (200) → dup-POST (409) → PUT (200) → athlete GET /program (200)` all green. The `dailyProgram` JSONB round-trips intact. Zero deltas from this source-read contract; enrichments inlined below (dup = 409; auth header = RAW token).

## Data model (the publish target)

One row = ONE calendar day, in one of two channels:

- `general_programs (id, scheduled_date DATE, training_level_id FK, is_rest_day BOOL, daily_program JSONB)` — shared by a training Level.
- `individual_programs (id, user_id FK, scheduled_date DATE, is_rest_day BOOL, daily_program JSONB)` — one athlete.
- CHECK: `is_rest_day` XOR `daily_program` (a rest day ⇒ `daily_program` NULL).
- Reference seeds (`schema.sql`): `training_levels {1 Scaled, 2 Pro, 3 Advanced}` (⚠ may have drifted — the iOS example JSON shows "RX"; read live), `user_roles {1 USER, 2 ADMIN}`, `user_plans {1 General, 2 Individual}`.
- `users.user_plan_id` decides a user's channel: 1 → General (by his `training_level_id`), 2 → Individual (by his `user_id`).
- No `TrainingPlan` / `Week` container exists — the legacy unit is the day. Publishing a plan = exploding it into N daily rows.

## `daily_program` JSON shape

```json
{
  "dayTrainings": [
    {
      "blocks": [
        { "exercises": ["5 sets [ choose weight ]:\n3 bench presses", "..."], "name": "STRENGTH" }
      ],
      "trainingNumber": 1
    }
  ]
}
```

`exercises` = free-text strings (the whole prescription as text with `\n`). `blocks[].name` = the block label. `dayTrainings` = the sessions within the day (`trainingNumber` = order). Empty `exercises: []` is allowed.

## Endpoints (`/api/v1` prefix)

| Method              | Path                                              | Auth   | Use                                                                                                                                |
| ------------------- | ------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| POST                | `/auth/signin`                                    | public | `{username=email, password}` → `{userId, accessToken, userRole{id,name}, userPlan{id,name}}`                                       |
| GET                 | `/trainingLevel/all`                              | public | Level picker (the General link target)                                                                                             |
| GET                 | `/userPlans`                                      | public | the 2 plan types                                                                                                                   |
| GET                 | `/user` · `/user?userPlanId=2`                    | auth   | list users / list Individual athletes (the Individual link picker): `{id, username, firstName, lastName, trainingLevel, userPlan}` |
| GET                 | `/generalProgram?trainingLevelId=&scheduledDate=` | ADMIN  | probe existing (republish)                                                                                                         |
| POST                | `/generalProgram`                                 | ADMIN  | create a general day — **insert-only, returns 409 if (level, date) exists**                                                        |
| PUT                 | `/generalProgram`                                 | ADMIN  | update (needs `id` in the body)                                                                                                    |
| DELETE              | `/generalProgram/{id}`                            | ADMIN  | delete                                                                                                                             |
| GET/POST/PUT/DELETE | `/individualProgram…`                             | ADMIN  | same, keyed by `userId`                                                                                                            |
| GET                 | `/program?userId=&scheduledDate=`                 | auth   | what the iOS app calls; routes by the user's `user_plan` to general/individual                                                     |

DTOs — `GeneralProgramDTO {id, scheduledDate, trainingLevel{id,name}, isRestDay, dailyProgram}` · `IndividualProgramDTO {id, userId, scheduledDate, isRestDay, dailyProgram}` · `dailyProgram = {dayTrainings:[{trainingNumber, blocks:[{name, exercises:[String]}]}]}`.

## Auth mechanics

- JWT HMAC256, subject = username(email); **expires in 1 MONTH** (`TokenProvider.genAccessExpirationDate` = now + 1 month, `-03:00`); **NO refresh endpoint** → reconnect on expiry.
- Sent as the `Authorization` header — send the **RAW `accessToken`, NO `Bearer ` prefix** (the filter does `replace("Bearer","")`, so a `Bearer ` prefix leaves a leading space that breaks JWT verify; the iOS app sends the bare token). `SecurityFilter` rejects disabled users (`is_enabled = false`).
- All program writes AND the program GETs are `hasRole("ADMIN")` (verified: a seeded `role=ADMIN` user passes the gate). `signin` lowercases the email. `signUp` has NO role field (creates a plain, disabled user) → an ADMIN must be seeded by SQL.

## Gotchas

- POST is insert-only → **409** on an existing (key, date); there is NO DB unique on (key, date) — dedup is app-level (`findByTrainingLevelIdAndDate`); republish = GET id → PUT; concurrency can double-insert.
- `schema.sql` is NOT auto-applied in prod (`sql.init.mode: never`, `ddl-auto: none`). The dev profile = `ddl-auto: update` (auto-DDL, but NO seed INSERTs).
- The iOS app also has an in-app `CreateProgram` (ADMIN authoring) — a published day can collide with one Denys typed directly → overwrite-guard (D-4).
- `docker-compose.yml` fronts everything with Caddy on the `thedisciplineprogram.com` host (`/api/*`→backend, `/dev-api/*`→backend-dev). Our local harness skips Caddy and hits `localhost:8080` directly.
