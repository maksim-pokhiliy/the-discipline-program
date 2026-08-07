/**
 * Boundary rules that enforce docs/BOUNDED-CONTEXTS.md §8 at the file-import
 * level. Closes audit bullet 1.3.A. Run via `pnpm dep:check`.
 *
 * Rule naming convention: `<scope>-<constraint>`. Each rule encodes one
 * dependency-direction invariant. Legitimate cross-context imports (listed
 * in the plan file for 1.3.A) are allowed by direction — the rules forbid
 * only the wrong direction.
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular dependencies make the codebase hard to reason about, break tree-shaking, " +
        "and are usually a sign of a missing abstraction. Fix the circular dep rather than " +
        "silencing this rule.",
      from: {},
      to: { circular: true },
    },

    {
      name: "contracts-no-prisma",
      severity: "error",
      comment:
        "@repo/contracts is a pure Zod schema package. It must not import Prisma types — " +
        "contracts is the API contract, Prisma is the DB reality, and they can drift. " +
        "Use the mapper layer in @repo/api-server to bridge.",
      from: { path: "^packages/contracts/" },
      to: { path: "@prisma/client" },
    },

    {
      name: "contracts-iam-is-leaf",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: IAM is a leaf. It must not depend on any other bounded " +
        "context. If you need an admin user view that includes coaching profiles, put the " +
        "projection in coaching/admin-user-view/ (see 1.2.J).",
      from: { path: "^packages/contracts/src/entities/iam/" },
      to: { path: "^packages/contracts/src/entities/(cms|lms|coaching|billing)/" },
    },

    {
      name: "contracts-lms-no-coaching-cms-billing",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: LMS depends on IAM only. LMS must not know about coach " +
        "dashboards (Coaching), marketing content (CMS), or commerce state (Billing). If a " +
        "schema needs to project LMS + Coaching data together, it belongs in coaching/ " +
        "(see 1.2.I plan-roster). Subscription gating is enforced upstream in a guard, not " +
        "via LMS reaching into Billing.",
      from: { path: "^packages/contracts/src/entities/lms/" },
      to: { path: "^packages/contracts/src/entities/(coaching|cms|billing)/" },
    },

    {
      name: "contracts-coaching-no-cms-billing",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: Coaching depends on IAM + LMS. Coaching schemas must not " +
        "project marketing content (CMS) or commerce state (Billing). Closes the contract-" +
        "side gap mirroring api-server-coaching-no-cms-billing.",
      from: { path: "^packages/contracts/src/entities/coaching/" },
      to: { path: "^packages/contracts/src/entities/(cms|billing)/" },
    },

    {
      name: "contracts-cms-no-lms-coaching-billing",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: CMS (marketing surface) must not read training data, " +
        "coach dashboards, or commerce state. CMS depends only on IAM.",
      from: { path: "^packages/contracts/src/entities/cms/" },
      to: { path: "^packages/contracts/src/entities/(lms|coaching|billing)/" },
    },

    {
      name: "contracts-billing-no-cms-coaching",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: Billing depends on IAM and LMS (via the Purchase = " +
        "Immediate Value invariant on TrainingPlan). Billing must not read marketing " +
        "content or coaching state.",
      from: { path: "^packages/contracts/src/entities/billing/" },
      to: { path: "^packages/contracts/src/entities/(cms|coaching)/" },
    },

    {
      name: "contracts-storage-is-leaf",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §1: Storage is a supporting context — a leaf that provides " +
        "file-upload shapes to any domain context that needs them. It must not depend on " +
        "any domain context itself. If an upload shape needs to reference domain data, " +
        "the reference belongs in the domain context (inverted dependency).",
      from: { path: "^packages/contracts/src/entities/storage/" },
      to: { path: "^packages/contracts/src/entities/(cms|lms|coaching|iam|billing)/" },
    },

    {
      name: "api-server-iam-is-leaf",
      severity: "error",
      comment:
        "IAM endpoints and mappers must not reach into other bounded contexts. User CRUD " +
        "is pure IAM; admin user views with coaching profiles live in " +
        "endpoints/coaching/admin-user-view.ts and mappers/coaching/admin-user-view.mapper.ts " +
        "(see 1.2.J). The authz/ directory is intentionally excluded from this rule because " +
        "it is cross-cutting policy, not a bounded context.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/iam/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|lms|coaching|billing)/" },
    },

    {
      name: "api-server-lms-no-coaching",
      severity: "error",
      comment:
        "Closes the LMS → Coaching leak fixed in 1.2.I. LMS endpoints and mappers own pure " +
        "PlanEnrollment; the enriched PlanRosterEntry with athlete health status lives in " +
        "coaching/plan-roster (Coaching → LMS, allowed). The authz/ directory is " +
        "intentionally excluded — it is cross-cutting policy that aggregates LMS + coaching " +
        "enum maps for ownership checks.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/lms/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/coaching/" },
    },

    {
      name: "api-server-cms-no-lms-coaching",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: CMS endpoints and mappers must not reach into LMS or " +
        "coaching. Marketing pages do not render training data or coach dashboards.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/cms/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(lms|coaching)/" },
    },

    {
      name: "api-server-lms-no-cms-billing",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: LMS must not read marketing content or commerce state. " +
        "LMS depends on IAM only; subscription gating is enforced upstream in a guard, not " +
        "by LMS endpoints reaching into Billing. Mirrors api-server-lms-no-coaching.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/lms/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|billing)/" },
    },

    {
      name: "api-server-coaching-no-cms-billing",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: Coaching does not render marketing content or manage " +
        "subscriptions. Coaching depends on IAM + LMS only. Closes the rule-catalog gap " +
        "for the Coaching → CMS / Billing direction (no Coaching → CMS / Billing imports " +
        "exist today, but the rule must land before Billing endpoints do).",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/coaching/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|billing)/" },
    },

    {
      name: "api-server-billing-no-cms-coaching",
      severity: "error",
      comment:
        "BOUNDED-CONTEXTS.md §8: Billing depends on IAM + LMS (planned Product→TrainingPlan link, not yet a column) " +
        "only. Billing must not read marketing content or coach state. The single allowed " +
        "cross-context write Billing → LMS (PlanEnrollment on purchase success, see §8 " +
        "'Purchase = Immediate Value') stays inside LMS — it does not require Coaching or " +
        "CMS reads.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/billing/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|coaching)/" },
    },

    {
      name: "api-server-storage-is-leaf",
      severity: "error",
      comment:
        "Storage is a supporting context — it provides upload functionality to any " +
        "domain context that needs it (admin uploading blog cover, coach uploading " +
        "athlete avatar, etc.). Storage endpoints and mappers must not depend on any " +
        "domain context; the dependency direction is always domain → storage. Closes " +
        "1.4.D — moved upload out of IAM into its own supporting context.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/storage/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|lms|coaching|iam|billing)/" },
    },

    {
      name: "api-server-mobile-compat-no-cms-billing",
      severity: "error",
      comment:
        "Mobile-compat serves the legacy iOS wire contract and is deliberately a " +
        "self-contained, disposable surface: it dies wholesale when the app is " +
        "redesigned. It legitimately reads IAM (credentials) and will read Coaching " +
        "in step 1.3 (the publish snapshot behind GET /program), so those stay open. " +
        "CMS and Billing have no business in a compat shim — deny them now, while the " +
        "surface is small, rather than after someone reaches sideways.",
      from: { path: "^packages/api-server/src/(endpoints|mappers)/mobile-compat/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|billing)/" },
    },

    {
      name: "api-server-test-helpers-only-from-tests",
      severity: "error",
      comment:
        "packages/api-server/src/test/ exports cleanupRaw — a RAW, un-extended PrismaClient " +
        "that bypasses the soft-delete extension, so its delete() is a hard cascading delete " +
        "and its findUnique() sees soft-deleted rows. It is exported (./test-helpers) purely " +
        "so the platform-project golden suite can seed, since prisma-only-in-api-server " +
        "forbids apps from importing @prisma/client directly. Test files in apps/* may reach " +
        "it; production app code may not. In-package test-support helpers are unaffected.",
      from: {
        path: "^apps/",
        pathNot: "(\\.(test|spec)\\.tsx?$|/__tests__/|/__fixtures__/)",
      },
      to: { path: "^packages/api-server/src/test/" },
    },

    {
      name: "prisma-only-in-api-server",
      severity: "error",
      comment:
        "@prisma/client is the DB reality and must be isolated to the api-server package. " +
        "Any other package that needs DB-shaped data should go through a contracts type + " +
        "mapper. This is the non-negotiable boundary between the public API and the DB schema.",
      from: { pathNot: "^packages/api-server/" },
      to: { path: "^@prisma/client" },
    },

    {
      name: "ui-no-backend",
      severity: "error",
      comment:
        "@repo/ui is a presentation-layer package. It must not import api-server or Prisma. " +
        "UI components receive data as props from consumers, not by reaching into the backend.",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/api-server/|^@prisma/client" },
    },

    {
      name: "api-routes-no-api-server",
      severity: "error",
      comment:
        "@repo/api-routes is a generic wrapper layer (auth middleware, error handling, CRUD " +
        "factories). It must not import business logic from api-server. Route handlers in " +
        "apps/* compose api-routes + api-server, but api-routes itself stays generic.",
      from: { path: "^packages/api-routes/" },
      to: { path: "^packages/api-server/" },
    },

    {
      name: "shared-packages-no-prisma",
      severity: "error",
      comment:
        "Cross-cutting packages (shared, mui, query, auth, errors, env, api-client, email) are " +
        "consumed by apps and must stay Prisma-free. Any data-shape dependency goes through " +
        "@repo/contracts instead.",
      from: {
        path: "^packages/(shared|mui|query|auth|errors|env|api-client|email)/",
      },
      to: { path: "^@prisma/client" },
    },

    {
      name: "marketing-only-cms-backend",
      severity: "error",
      comment:
        "apps/marketing is the public landing site. It must only reach CMS endpoints + " +
        "mappers. No LMS (training data), no coaching (dashboards), no IAM admin endpoints, " +
        "no billing. This rule encodes the 'apps/marketing should only see CMS' invariant " +
        "(see docs/BOUNDED-CONTEXTS.md §9).",
      from: { path: "^apps/marketing/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(lms|coaching|iam|billing)/" },
    },

    {
      name: "admin-no-lms",
      severity: "error",
      comment:
        "apps/admin serves CMS management + admin user/dashboard + admin LMS libraries " +
        "(M1.2/M1.3 + M2.6). It does not need direct access to LMS plan/block/segment endpoints — " +
        "those are platform (coach) concerns. The library endpoints (Exercise / BlockType / " +
        "SchemeType / DayType CRUD per ADR-0039) are explicitly allowed via the carve-out.",
      from: { path: "^apps/admin/" },
      to: {
        path: "^packages/api-server/src/(endpoints|mappers)/lms/",
        pathNot: [
          "^packages/api-server/src/endpoints/lms/index\\.ts$",
          "^packages/api-server/src/endpoints/lms/library/index\\.ts$",
          "^packages/api-server/src/endpoints/lms/library/(exercise|block-type|scheme-type|day-type)/[^/]+\\.ts$",
          "^packages/api-server/src/endpoints/lms/label/[^/]+\\.ts$",
          "^packages/api-server/src/endpoints/lms/exercise/[^/]+\\.ts$",
          "^packages/api-server/src/mappers/lms/index\\.ts$",
          "^packages/api-server/src/mappers/lms/(exercise|block-type|scheme-type|day-type)\\.mapper\\.ts$",
          "^packages/api-server/src/mappers/lms/label\\.mapper\\.ts$",
          "^packages/api-server/src/mappers/lms/exercise\\.enum-maps\\.ts$",
        ],
      },
    },

    {
      name: "admin-coaching-only-via-user-detail-route",
      severity: "error",
      comment:
        "apps/admin can only reach coaching through the single admin-user-view route " +
        "(apps/admin/src/app/api/admin/users/[id]/route.ts). If another admin file needs " +
        "coaching, that is architecturally significant and requires an audit bullet, not a " +
        "silent rule weakening. File-precise carve-out established in 1.2.J + 1.3.A.",
      from: {
        path: "^apps/admin/",
        pathNot: [
          "^apps/admin/src/app/api/admin/users/\\[id\\]/route\\.ts$",
          "^apps/admin/src/app/api/admin/profile-axes/route\\.ts$",
          "^apps/admin/src/app/api/admin/profile-axes/\\[id\\]/route\\.ts$",
          "^apps/admin/src/app/api/admin/profile-axes/page-data/route\\.ts$",
        ],
      },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/coaching/" },
    },

    {
      name: "platform-no-cms-billing",
      severity: "error",
      comment:
        "apps/platform is the coach + athlete product surface. It does not render CMS " +
        "content or process billing. Its allowed backend surface is LMS + Coaching + IAM.",
      from: { path: "^apps/platform/" },
      to: { path: "^packages/api-server/src/(endpoints|mappers)/(cms|billing)/" },
    },

    {
      name: "apps-do-not-import-each-other",
      severity: "error",
      comment:
        "Each Next.js app is its own deployable: admin (M1.2 internal console), " +
        "marketing (public landing), platform (coach/athlete product), storybook " +
        "(component preview). Cross-app imports cannot be resolved by Next at build " +
        "time — a relative `../../<other-app>` path would only fail when the offending " +
        "app builds. Encoding the boundary in dep-cruiser surfaces the violation in " +
        "`pnpm dep:check` instead, alongside the other forbidden directions. Shared code " +
        "belongs in `packages/`, not in another app.",
      from: { path: "^apps/admin/" },
      to: { path: "^apps/(marketing|platform|storybook)/" },
    },

    {
      name: "apps-marketing-no-other-apps",
      severity: "error",
      comment:
        "Mirror of apps-do-not-import-each-other for marketing. Each app is its own " +
        "deployable; shared code belongs in `packages/`.",
      from: { path: "^apps/marketing/" },
      to: { path: "^apps/(admin|platform|storybook)/" },
    },

    {
      name: "apps-platform-no-other-apps",
      severity: "error",
      comment:
        "Mirror of apps-do-not-import-each-other for platform. Each app is its own " +
        "deployable; shared code belongs in `packages/`.",
      from: { path: "^apps/platform/" },
      to: { path: "^apps/(admin|marketing|storybook)/" },
    },

    {
      name: "apps-storybook-no-other-apps",
      severity: "error",
      comment:
        "Mirror of apps-do-not-import-each-other for storybook. Storybook previews " +
        "components from `packages/ui` (and other shared packages), never from another " +
        "Next.js app's source tree.",
      from: { path: "^apps/storybook/" },
      to: { path: "^apps/(admin|marketing|platform)/" },
    },
  ],

  options: {
    /*
     * pnpm workspace + subpath exports: dep-cruiser must honor the `exports`
     * field in package.json so @repo/api-server/cms resolves to
     * packages/api-server/src/endpoints/cms/index.ts (via the exports map),
     * and @repo/contracts/coaching/plan-roster resolves similarly.
     *
     * No root tsConfig is passed — there's no root tsconfig.json in the
     * repo. Boundary rules work on raw file paths, not on alias resolution,
     * so we don't need dep-cruiser to resolve @app/* path aliases.
     */
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "default", "types"],
      mainFields: ["main", "types"],
    },

    /*
     * Don't walk into build artifacts or dependency trees.
     */
    doNotFollow: {
      path: "node_modules|dist|\\.next|\\.turbo|storybook-static",
    },

    /*
     * Exclude build outputs entirely from analysis. storybook-static
     * contains bundled JS with naturally circular imports that are an
     * artifact of bundling, not real source-code cycles.
     */
    exclude: {
      path: "node_modules|dist|\\.next|\\.turbo|storybook-static",
    },

    /*
     * Only analyze repo source (apps + packages). Skip docs, scripts,
     * top-level config files.
     */
    includeOnly: "^(apps|packages)/",

    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
