// @vitest-environment node
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type * as ApiServerTestHelpers from "@repo/api-server/test-helpers";

const V1_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const collectRouteFiles = (dir: string, prefix = ""): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      return entry === "__tests__" ? [] : collectRouteFiles(full, `${prefix}/${entry}`);
    }

    return entry === "route.ts" ? [prefix] : [];
  });

describe("api/v1 route mounting", () => {
  it("mounts exactly the three wire paths the iOS app calls, and nothing else", () => {
    expect(collectRouteFiles(V1_ROOT).sort()).toEqual([
      "/auth/signin",
      "/trainingLevel/all",
      "/userPlans",
    ]);
  });
});

const SHOULD_RUN = process.env.RUN_LEGACY_INTEGRATION === "1";
const LEGACY_BASE = "http://localhost:8080/api/v1";

type Probe = { status: number; body: string };

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
};

const routeContext = { params: Promise.resolve(undefined) };

const PLATFORM_ROOT = join(V1_ROOT, "../../../..");

const loadPlatformEnv = (): void => {
  try {
    process.loadEnvFile(join(PLATFORM_ROOT, ".env.local"));
  } catch {
    throw new Error(
      "apps/platform/.env.local is required for the golden run: it supplies DATABASE_URL and " +
        "MOBILE_SHIM_JWT_SECRET. The vitest platform project loads no env of its own.",
    );
  }
};

describe.skipIf(!SHOULD_RUN)("mobile shim golden contract", () => {
  let signinRoute: (request: Request, context: typeof routeContext) => Promise<Response>;
  let trainingLevelsRoute: (request: Request, context: typeof routeContext) => Promise<Response>;
  let userPlansRoute: (request: Request, context: typeof routeContext) => Promise<Response>;
  let helpers: typeof ApiServerTestHelpers;
  const createdUserIds: string[] = [];

  const hitShimSignin = async (body: string): Promise<Probe> => {
    const response = await signinRoute(
      new Request("http://localhost:3001/api/v1/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
      routeContext,
    );

    return { status: response.status, body: await response.text() };
  };

  const hitLegacySignin = async (body: string): Promise<Probe> => {
    const response = await fetch(`${LEGACY_BASE}/auth/signin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    return { status: response.status, body: await response.text() };
  };

  const expectSameFailure = (shim: Probe, legacy: Probe): void => {
    expect(shim.status).toBe(legacy.status);
    expect(shim.status).toBe(403);
    expect(shim.body).toBe("");
    expect(legacy.body).toBe("");
  };

  beforeAll(async () => {
    loadPlatformEnv();

    const [signinModule, levelsModule, plansModule, helpersModule] = await Promise.all([
      import("../auth/signin/route"),
      import("../trainingLevel/all/route"),
      import("../userPlans/route"),
      import("@repo/api-server/test-helpers"),
    ]);

    signinRoute = signinModule.POST;
    trainingLevelsRoute = levelsModule.GET;
    userPlansRoute = plansModule.GET;
    helpers = helpersModule;

    for (const fixture of helpers.GOLDEN_FIXTURE_USERS) {
      const existing = await helpers.cleanupRaw.user.findUnique({
        where: { email: fixture.email },
      });

      if (existing) {
        await helpers.cleanupRaw.mobileLegacyIdentity.deleteMany({
          where: { userId: existing.id },
        });
        await helpers.cleanupRaw.user.delete({ where: { id: existing.id } });
      }

      const user = await helpers.createTestUser({
        email: fixture.email,
        password: helpers.GOLDEN_BCRYPT_HASH,
      });

      createdUserIds.push(user.id);

      await helpers.createTestLegacyIdentity(user.id, {
        legacyUserId: fixture.legacyUserId,
        legacyRoleId: fixture.legacyRoleId,
        legacyPlanId: fixture.legacyPlanId,
        legacyLevelId: fixture.legacyLevelId,
        isEnabled: fixture.isEnabled,
        firstName: fixture.firstName,
        lastName: fixture.lastName,
      });
    }
  });

  afterAll(async () => {
    await helpers.cleanupRaw.mobileLegacyIdentity.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await helpers.cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("matches the legacy signin response for an enabled athlete", async () => {
    const body = JSON.stringify({
      username: helpers.GOLDEN_ATHLETE.email,
      password: helpers.GOLDEN_PASSWORD,
    });
    const [shim, legacy] = await Promise.all([hitShimSignin(body), hitLegacySignin(body)]);

    expect(shim.status).toBe(200);
    expect(legacy.status).toBe(200);

    const shimJson = JSON.parse(shim.body) as Record<string, unknown>;
    const legacyJson = JSON.parse(legacy.body) as Record<string, unknown>;

    expect(shimJson.accessToken).toEqual(expect.any(String));
    expect(canonicalize({ ...shimJson, accessToken: null })).toEqual(
      canonicalize({ ...legacyJson, accessToken: null }),
    );
  });

  it("matches the legacy signin response for an admin", async () => {
    const body = JSON.stringify({
      username: helpers.GOLDEN_ADMIN.email,
      password: helpers.GOLDEN_PASSWORD,
    });
    const [shim, legacy] = await Promise.all([hitShimSignin(body), hitLegacySignin(body)]);

    const shimJson = JSON.parse(shim.body) as Record<string, unknown>;
    const legacyJson = JSON.parse(legacy.body) as Record<string, unknown>;

    expect(shim.status).toBe(legacy.status);
    expect(canonicalize({ ...shimJson, accessToken: null })).toEqual(
      canonicalize({ ...legacyJson, accessToken: null }),
    );
  });

  it("matches the legacy failure for a wrong password", async () => {
    const body = JSON.stringify({
      username: helpers.GOLDEN_ATHLETE.email,
      password: "definitely-wrong",
    });

    expectSameFailure(...([await hitShimSignin(body), await hitLegacySignin(body)] as const));
  });

  it("matches the legacy failure for an unknown user", async () => {
    const body = JSON.stringify({
      username: helpers.GOLDEN_UNKNOWN_EMAIL,
      password: helpers.GOLDEN_PASSWORD,
    });

    expectSameFailure(...([await hitShimSignin(body), await hitLegacySignin(body)] as const));
  });

  it("matches the legacy failure for a disabled user", async () => {
    const body = JSON.stringify({
      username: helpers.GOLDEN_DISABLED.email,
      password: helpers.GOLDEN_PASSWORD,
    });

    expectSameFailure(...([await hitShimSignin(body), await hitLegacySignin(body)] as const));
  });

  it("matches the legacy failure for a malformed body, emitting no 400 anywhere", async () => {
    const body = "this-is-not-json";
    const shim = await hitShimSignin(body);
    const legacy = await hitLegacySignin(body);

    expectSameFailure(shim, legacy);
    expect(shim.status).not.toBe(400);
    expect(legacy.status).not.toBe(400);
  });

  it("matches the legacy training level catalog, order included", async () => {
    const shim = await trainingLevelsRoute(
      new Request("http://localhost:3001/api/v1/trainingLevel/all"),
      routeContext,
    );
    const legacy = await fetch(`${LEGACY_BASE}/trainingLevel/all`);

    expect(shim.status).toBe(legacy.status);
    expect(canonicalize(await shim.json())).toEqual(canonicalize(await legacy.json()));
  });

  it("matches the legacy user plan catalog, order included", async () => {
    const shim = await userPlansRoute(
      new Request("http://localhost:3001/api/v1/userPlans"),
      routeContext,
    );
    const legacy = await fetch(`${LEGACY_BASE}/userPlans`);

    expect(shim.status).toBe(legacy.status);
    expect(canonicalize(await shim.json())).toEqual(canonicalize(await legacy.json()));
  });
});
