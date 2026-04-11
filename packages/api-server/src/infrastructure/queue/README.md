# Queue port

Asynchronous job execution. Used for work that must happen eventually but not on the request path: sending notifications, recomputing aggregates, generating exports, processing webhook payloads, nightly rollups.

## Why a port?

Queue backends diverge more than storage or email vendors, but the _producer_ side (enqueue a job) is universally stable. Every serious queue accepts `(name, payload, delay?)` and returns a job ID. The port commits only to the producer side. The consumer side (worker lifecycle, handler registration, retry policy, visibility timeout) is intentionally **not** on the port because those shapes vary enough across BullMQ / Inngest / QStash / SQS / Cloudflare Queues that committing to one model now would be vendor speculation.

## Shape

`enqueue<T>(jobName, payload, { delayMs? })` schedules a job and returns `{ jobId }`. The job name is a string because that's what every backend accepts; consumers define a named constant (or enum) somewhere in the domain layer. The payload generic `T` is a soft contract — backends serialize to JSON, so `T` must be JSON-serializable. Non-JSON payloads (Date, Buffer, Map) are the caller's responsibility to convert at the boundary.

`delayMs` is optional. Zero or omitted means "run as soon as a worker is available". A non-zero value means "don't start execution before N milliseconds from now". All candidate backends support this — the term differs (Inngest `ts`, BullMQ `delay`, SQS `DelaySeconds`) but the concept is universal.

## Vendor candidates

| Vendor            | Model                           | Runtime             | Retries  | Cost (10k jobs/mo) | Notes                                                                              |
| ----------------- | ------------------------------- | ------------------- | -------- | ------------------ | ---------------------------------------------------------------------------------- |
| Inngest           | Serverless-native, event-driven | Any, including Edge | Built-in | Free tier ~50k     | First-class Next.js integration, durable workflows, works with Vercel              |
| QStash (Upstash)  | HTTP-based scheduler            | Any                 | Built-in | Pay-per-request    | Simplest producer model; sends HTTP callbacks; limited orchestration               |
| BullMQ            | Redis-backed                    | Node long-running   | Built-in | Redis cost only    | Requires a persistent worker process; doesn't fit Vercel serverless cleanly        |
| SQS + Lambda      | AWS-native                      | AWS                 | Built-in | Near-zero          | Boring, reliable, cheap at scale; AWS lock-in; needs infra work to deploy handlers |
| Cloudflare Queues | CF Workers-native               | CF Workers          | Built-in | Pay-per-request    | Great if we're on CF; terrible otherwise                                           |

Current lean: **Inngest**. The serverless-native model matches our Vercel deployment target, durable workflows let us handle multi-step jobs without writing a state machine, and the free tier covers our projected v1 volume. If we hit scale limits, migration to QStash or a Lambda-based approach is a pure adapter swap on the producer side — the consumer code lives outside this port regardless.

## Open questions (deferred until vendor is chosen)

- **Consumer registration.** How workers subscribe to jobs is intentionally not on this port. Inngest uses `inngest.createFunction({ event, handler })` at module load. BullMQ uses `new Worker(name, handler)` with an explicit Redis connection. QStash uses HTTP callbacks to a Next.js route handler. These are fundamentally different lifecycles and must be codified as a separate `QueueWorker` port (or inlined into Next.js route handlers) when the vendor is chosen. **Do not add `register()` to this port preemptively** — it would be vendor speculation, which is exactly what 1.4.B was reverted for.
- **Idempotency keys.** Jobs triggered by webhooks (e.g. Stripe `invoice.paid` → "send receipt email") need idempotency. Will add `idempotencyKey?: string` to `EnqueueOptions` when the first webhook consumer lands. Non-breaking addition.
- **Retry policy.** `EnqueueOptions` currently has no retry knob because retry is better expressed declaratively on the consumer side (Inngest: `retries: 3`, BullMQ: `attempts: 3` + `backoff: { type: "exponential", delay: 1000 }`). The producer shouldn't commit to a specific retry strategy — that's a worker concern.
- **Job cancellation / priority / uniqueness.** All are vendor-specific and none have honest common shapes. Deferred until concretely needed.
- **Observability.** Every job enqueue ideally emits a log with correlation ID + trace span. That's cross-cutting (section 4 Reliability / section 11 Quality) and shouldn't bloat the port. Adapter wraps logging, port stays minimal.

## Adapter placement

When vendor is chosen:

1. `infrastructure/queue/inngest-adapter.ts` (or similar) — the ONLY file in the repo that imports the vendor SDK.
2. Register env vars in `packages/env/queue.ts` (create when adapter lands).
3. Update `infrastructure/queue/index.ts` to re-export the adapter factory and expose `defaultQueue = createInngestAdapter()`.
4. Consumers inject via factory-DI: `createXxxAdminApi({ queue })`.
5. **Worker routing is a separate concern.** Inngest workers live as Next.js route handlers under `apps/<app>/src/app/api/inngest/route.ts`. BullMQ workers would need a separate long-running process (not Vercel-friendly). QStash workers are Next.js route handlers at `/api/jobs/<name>/route.ts`. None of this touches the `QueuePort` interface — the port is producer-only.

## Non-goals

- **Cron / scheduled jobs.** "Every day at 3 AM do X" is distinct from "right now enqueue this thing". Inngest supports cron natively; Vercel Cron posts to a route handler. Cron integration is not this port — if it lands as a port, it's `CronPort`.
- **Long-running background services.** Anything that needs to run continuously (WebSocket server, polling worker, daemon) is not a queue job — that's infrastructure, not an application job. Won't fit here.
- **Workflow orchestration as a domain concern.** Multi-step workflows with branching and compensation are what Inngest durable functions are for, but the domain layer should see them as regular jobs enqueued in sequence. If we start needing a state machine at the domain level, that's a design signal, not a port addition.
