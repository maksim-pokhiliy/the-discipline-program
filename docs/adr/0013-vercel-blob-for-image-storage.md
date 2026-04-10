# 0013. Vercel Blob for image storage

- **Status:** Accepted (interim — see Consequences)
- **Date:** 2026-04-10
- **Tags:** `storage`, `infrastructure`, `vendor-dependency`, `interim`

## Context

The admin CMS uploads images for blog cover images, page hero backgrounds, product photos, review author avatars, and profile pictures. The storage layer must:

1. **Accept uploads via a typed API** (`PUT filename → url`).
2. **Return publicly accessible URLs** for marketing pages to render without authentication.
3. **Be cheap at low volume.** At pre-launch scale, we are talking about tens to hundreds of images, not millions. Paying an S3 minimum charge per month for a quiet dev environment is silly.
4. **Integrate without a multi-week infrastructure detour.** The team does not have time to stand up a bucket, configure CORS, wire credentials, and debug signed URLs.
5. **Work from Next.js route handlers** running on Vercel serverless with no extra SDK quirks.
6. **Be replaceable.** If we outgrow it, the switch to S3 / R2 / GCS should not be a six-week migration.

The constraint that matters most today is the fourth one — time to first upload. The constraint that matters most tomorrow is the sixth — replaceability.

## Decision

We use **Vercel Blob** (`@vercel/blob` 0.27.0) as the image storage layer for the interim. The token is provided via `BLOB_READ_WRITE_TOKEN` through `@repo/env/blob`. The upload endpoint lives at `packages/api-server/src/endpoints/admin/upload.ts` and calls `put` and `del` from `@vercel/blob` directly.

The config for allowed file types, max size, and storage prefix lives in `@repo/contracts/upload` via `UPLOAD_CONFIG[context]`, where `context` is a typed enum (`UploadContext`) that names the kind of upload ("blog-cover", "review-avatar", etc.). Each context has its own accepted MIME types, max size, and storage prefix.

Uploaded URLs are public (`access: "public"`) and returned to the client as plain URL strings. They are stored in the database as strings in columns like `MarketingBlogPost.coverImage` and `Product.image`.

## Consequences

**Positive:**

- **Zero infrastructure setup.** Vercel Blob is provisioned through the Vercel dashboard. No IAM, no CORS config, no bucket policies, no signed URL logic. One env var and the SDK works.
- **Same-vendor deploy.** We deploy to Vercel (see ADR 0002). Storage in the same vendor means one fewer external dependency, one fewer place where network latency surprises us, one fewer failure mode.
- **The SDK is tiny** (`put`, `del`, `list` — that is almost the entire API). The learning curve is measured in minutes.
- **URLs are returned directly from `put`.** No signed URL generation, no expiry management, no cache-busting negotiation. Works for the "public image on a marketing page" use case in the simplest possible way.
- **Built-in CDN.** Vercel Blob URLs are served from Vercel's edge network. We get CDN caching for free on every uploaded image.

**Negative:**

- **Direct vendor coupling.** `packages/api-server/src/endpoints/admin/upload.ts` imports `put` and `del` from `@vercel/blob` directly. There is no port / adapter abstraction — the SDK is in the endpoint file. This is flagged as a dependency-inversion violation in the Big Tech audit, section 1.4, and is scheduled to be fixed in commit 1.4.A by introducing a `StoragePort` interface and a `vercelBlobAdapter`.
- **Vendor lock-in scales with image count.** Migrating to S3 at 100 images is trivial. At 100,000 images, it is a weekend of migration scripting. At 10 million, it is a project. The later we abstract, the more expensive the decoupling becomes.
- **Pricing is not the best at scale.** Vercel Blob is competitive at low volume. At high volume, S3 or R2 is cheaper by a meaningful margin. Not an issue today; will be an issue if the platform ever serves millions of images.
- **Collision risk in filenames.** The current upload code uses `Date.now()` as part of the filename, which collides under bursty uploads (two in the same millisecond). The fix is straightforward (use `crypto.randomUUID()` or a content hash), and it is tracked in the audit section 3.
- **No retry, no timeout, no error mapping.** The `put` and `del` calls are awaited without any resilience guarantees. If Vercel Blob is briefly unreachable, the upload fails with an opaque error. When we introduce the `StoragePort` adapter, these become properties of the adapter implementation.

**Neutral:**

- `BLOB_READ_WRITE_TOKEN` is one of the env vars that must be in `turbo.json` `globalEnv`. Missing it there was the cause of commit `cab4fe1`. Documented so we do not repeat the mistake for the next env var that lands.
- The `@repo/env/blob` entry exists specifically to isolate the blob token from the rest of the env. If we migrate storage providers, only `@repo/env/storage` would need to change (after ADR supersession).

## Alternatives considered

**AWS S3.** The industry default. Cheaper at scale, more mature, more configurable, more portable. Rejected for now purely on time-to-first-upload grounds: S3 requires IAM, bucket policies, CORS, signed URL generation, and a retry/backoff client. For a pre-launch project, that is a week of infrastructure work for no user-visible benefit. Worth revisiting when image volume is non-trivial or when pricing tips in favor of S3.

**Cloudflare R2.** S3-compatible API with egress-free pricing. Genuinely attractive long-term. Rejected for the same reason as S3 — setup cost — with a note that if we do migrate away from Vercel Blob, R2 is the first alternative to evaluate, not S3. R2's S3-compat means the same adapter code could point at either.

**Supabase Storage.** Convenient if we were on Supabase for the database. We are not (we use Prisma on plain Postgres per ADR 0003). Rejected to avoid taking on a second vendor for a single feature.

**Google Cloud Storage.** Similar to S3 in capability, similar setup cost, not same-vendor as Vercel. No reason to pick it over S3 or R2.

**Self-hosted MinIO / SeaweedFS.** Maximum control, maximum infrastructure burden, maximum on-call pager surface. Rejected as wrong tradeoff for a team without a dedicated infra engineer.

**Store images in the Postgres database as `bytea`.** Simple in the sense that "it is one system to manage", but a catastrophe at any meaningful volume. Database backups become gigabytes, query planners get confused, connection pools saturate on blob reads. Rejected out of hand.

**Base64-encode images into page data.** A non-serious option included for completeness. Rejected.

## References

- `packages/api-server/src/endpoints/admin/upload.ts` — the direct SDK usage that will be refactored behind a port.
- `packages/contracts/src/entities/upload/` — `UploadContext` and `UPLOAD_CONFIG`.
- `packages/env/src/blob.ts` — the `BLOB_READ_WRITE_TOKEN` env validation.
- `apps/admin/next.config.ts` and `apps/marketing/next.config.ts` — `remotePatterns` allowing `*.public.blob.vercel-storage.com` for `next/image`.
- ADR 0002 — Turbo / Vercel deployment context.
- Big Tech audit, section 1.4 — the port/adapter refactor scheduled as commit 1.4.A.
