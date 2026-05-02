# Infrastructure ports

This directory is the ports-and-adapters layer of api-server. Each subdirectory is **one port** — a stable interface the domain layer depends on — plus zero or more **adapters** implementing that interface against a specific vendor or backend.

## Why this layer exists

Before 1.4.A, `@vercel/blob` was imported directly in the upload endpoint. Any switch to S3 / R2 / Cloudflare R2 would have required edits in the endpoint layer, plus a reshape of tests, plus risk of leaking vendor details into contract shapes. The port-and-adapter pattern isolates vendor coupling to exactly one file per port: the adapter. Everything else depends on the `*Port` interface. The upload endpoint itself was then relocated to its own supporting context (`endpoints/storage/upload.ts`) in 1.4.D — storage is cross-cutting, not a part of IAM.

Port interfaces are owned by this directory, not by consumers. Consumers (`endpoints/*`) inject a port through a factory (the `createXxx(deps)` pattern — see `endpoints/storage/upload.ts` for the reference). Default instances live in the per-port `index.ts` barrel. Tests pass fakes (`vi.fn()`-based or in-memory) directly to the factory, bypassing `index.ts` entirely — which means the real adapter is never constructed at test import time, so vendor SDKs are never loaded in tests even if they eagerly validate env vars or open connections.

## Dependency rules

- The `infrastructure/` directory is **outside** all context-scoped dep-cruiser rules (rules anchor on `from.path: (endpoints|mappers)/<ctx>/`). Ports are cross-cutting by definition.
- A `port.ts` file imports **zero** vendor SDKs. It declares types only. No runtime code.
- A `*-adapter.ts` file is the **only** file in the api-server package that imports its vendor SDK. Dep-cruiser can enforce this with a scoped rule if drift becomes a problem.
- The `index.ts` barrel imports the adapter factory and constructs the default instance (a module-level singleton). Consumers import the default from here. Tests never import from `index.ts` — they import the factory directly and pass a fake.

## Convention per port

Each port subdirectory contains:

```
<port-name>/
  port.ts                 required. Types + interface only. Zero vendor SDK imports.
  README.md               required. Purpose, shape, vendor candidates, open questions, adapter placement plan, non-goals.
  index.ts                required. Barrel: re-exports port types. When an adapter exists, also re-exports the adapter factory and exposes `default<Port>` as a module-level singleton.
  <vendor>-adapter.ts     optional (exists only when vendor is chosen). The ONLY file importing the vendor SDK.
```

New ports follow this shape. When adding one:

1. Create the subdirectory + `port.ts` + `README.md` + `index.ts`.
2. Do NOT speculate about the vendor adapter in `port.ts`. If you don't know the signature, the port is not ready — scope it narrower or wait until you do.
3. Do NOT add a `register(...)` / `subscribe(...)` method until you can point at a concrete consumer that needs it. Speculative methods age into either vendor-shaped leaks or `NotImplementedError` stubs.
4. Test doubles should be real fake adapters (implementing the interface with in-memory state), not `vi.fn()` mocks, when the test exercises more than one port method. `vi.fn()` is fine for single-method ports.

## Active ports

| Port    | Status        | Default adapter                                 |
| ------- | ------------- | ----------------------------------------------- |
| storage | Live          | `vercel-blob`                                   |
| email   | Live          | `@repo/email/createResendEmailService` (Resend) |
| payment | Scaffold only | —                                               |
| queue   | Scaffold only | —                                               |
| cache   | Scaffold only | —                                               |

"Scaffold only" means the `port.ts` interface exists and is considered stable for a first adapter, but no adapter has landed yet. Consumers may import the type for design purposes, but there is no default instance to inject at runtime. Adding an adapter requires:

1. A vendor selection (technical + business decision).
2. A `<vendor>-adapter.ts` implementing `<Port>`.
3. Env var registration in `packages/env/<port>.ts`.
4. Update `index.ts` to construct `default<Port>` from the new adapter.
5. Wire the default into the consumer's endpoint barrel (same pattern as `endpoints/storage/index.ts` wiring `defaultStorage` into `createStorageUploadAdminApi`).

## Non-goals for this layer

- **Domain logic.** If code belongs in an endpoint (validation, authorization, business rules), it does not belong in a port.
- **Shared utilities.** `utils/` is for cross-cutting helpers (date math, error translation). `infrastructure/` is for vendor abstractions. Don't cross-contaminate.
- **Cross-context aggregation.** That's what `authz/guards.ts` does — it's explicitly not under `infrastructure/`. The guard layer handles policy, not I/O.
