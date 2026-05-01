# `@repo/contracts`

Zod schemas + inferred types — the single source of truth for API request/response shapes ([ADR 0005](../../docs/adr/0005-contracts-first-with-zod.md)). Imported by route handlers, services, the API client, and React Query factories. The contracts are the law: shape disagreements between client and server resolve to "fix the contract first".

## Public API

Subpath exports per **bounded context → entity**. Consumers import the entity-shaped subpath, never the package root for entity work.

```ts
import {} from /* common */ "@repo/contracts/common";
import {} from /* CMS entities */ "@repo/contracts/cms/blog";
import {} from /* LMS entities */ "@repo/contracts/lms/exercise-library-item";
import {} from /* coaching entities */ "@repo/contracts/coaching/coach-profile";
```

Subpath taxonomy:

- `common` — shared primitives (pagination cursor, ID brand, error response shape).
- `cms/<entity>` — CMS context: `blog`, `contact`, `dashboard`, `pages`, `product`, `review`.
- `lms/<entity>` — LMS context: `_domain` (shared LMS primitives), `benchmark`, `block`, `block-kind`, `block-segment`, `block-session`, `block-template`, `day`, `exercise-entry`, `exercise-library-item`, `exercise-log`, `lms-session`, `personal-record`, `plan-coach-assignment`, `plan-enrollment`, `plan-override`, `scheme-template`, `session-template`, `set-group`, `set-log`, `training-plan`, `week`, `week-template`, `weekly-volume`, `workout-session`.
- `coaching/<entity>` — coaching context: profiles, athletes lists, invites, notes, dashboards.
- `iam/<entity>` — identity + role contracts.

## Conventions

- Each entity exports `<EntityName>Schema` (the Zod schema) and `<EntityName>` (the inferred type). List endpoints use `<EntityName>ListItemSchema` + `<EntityName>ListItem`; detail endpoints use the full schema. This trim is intentional ([ADR 0020](../../docs/adr/0020-api-design-decisions.md)).
- Discriminated payloads (e.g., scheme params, promotion variants) use Zod discriminated unions, not optional fields. See [ADR 0031](../../docs/adr/0031-scheme-params-as-discriminated-json.md).
- ID brands live in `common` and are re-exported into entity files when they cross context boundaries.

## Related ADRs

- [ADR 0005 — contracts-first with Zod](../../docs/adr/0005-contracts-first-with-zod.md)
- [ADR 0020 — API design decisions](../../docs/adr/0020-api-design-decisions.md)
- [ADR 0031 — scheme params as discriminated JSON](../../docs/adr/0031-scheme-params-as-discriminated-json.md)
