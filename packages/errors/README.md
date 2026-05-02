# `@repo/errors`

Error hierarchy for the monorepo. Discriminated-union shapes that flow from services → route handlers → API client → UI without leaking implementation detail across boundaries.

## Public API

```ts
import {} from /* error classes + type guards */ "@repo/errors";
```

Single entry point. Classes encode the kind on the prototype so `instanceof` works at runtime; types narrow on `kind` for exhaustive switches.

## Layout

```
src/
  index.ts        Barrel — re-exports every error class + the AppError union
  <error>.ts      One class per error kind (NotFoundError, ValidationError, UnauthorizedError, ...)
```

## Conventions

- Domain code throws `AppError` subclasses; the route handler boundary catches and maps them to `{ error: { code, message, details? } }` per [ADR 0020](../../docs/adr/0020-api-design-decisions.md).
- The API client decodes the wire shape back into the same classes so consumers `instanceof`-check the same way on both sides.
- Validation messages destined for users go through `notifyError` / `getIssues` from `@repo/query` (`packages/query/src/hooks/notify-error.ts`), which normalizes the `{ error: { details: { issues } } }` shape before falling back to `error.message`.

## Related ADRs

- [ADR 0020 — API design decisions](../../docs/adr/0020-api-design-decisions.md) (error response shape)
