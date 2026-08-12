// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getRateLimiter, setRateLimiter } from "@repo/api-routes";
import type { RateLimiterPort } from "@repo/api-routes";
import type * as ApiServerTestHelpers from "@repo/api-server/test-helpers";
import type * as PublishedSnapshotHelpers from "@repo/api-server/test-helpers/published-snapshot";

import { MOBILE_SHIM_SIGNIN_RATE_LIMIT } from "@app/lib/server/mobile-shim-rate-limit";

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
  it("mounts exactly the wire paths the iOS app calls, and nothing else", () => {
    expect(collectRouteFiles(V1_ROOT).sort()).toEqual([
      "/auth/signin",
      "/program",
      "/trainingLevel/all",
      "/user",
      "/user/[id]",
      "/user/changePassword",
      "/userPlans",
    ]);
  });

  it.each([
    ["auth/signin", "POST", "GET"],
    ["trainingLevel/all", "GET", "POST"],
    ["userPlans", "GET", "POST"],
    ["user/[id]", "GET", "POST"],
    ["user", "PUT", "POST"],
    ["user/changePassword", "PATCH", "POST"],
    ["program", "GET", "POST"],
  ])("%s exports %s and not %s", (routePath, expectedVerb, forbiddenVerb) => {
    const source = readFileSync(join(V1_ROOT, routePath, "route.ts"), "utf8");

    expect(source).toMatch(new RegExp(`export const ${expectedVerb}\\b`));
    expect(source).not.toMatch(new RegExp(`export const ${forbiddenVerb}\\b`));
  });
});

describe("mobile shim signin rate limit configuration", () => {
  it("keys the account limb on the field the handler authenticates with", () => {
    expect(MOBILE_SHIM_SIGNIN_RATE_LIMIT.identifierFields).toEqual(["username"]);
  });

  it("parses the body as json so the limiter cannot be steered by a form-encoded decoy", () => {
    expect(MOBILE_SHIM_SIGNIN_RATE_LIMIT.identifierParse).toBe("json");
  });

  it("keeps the per-address allowance far above the per-account one", () => {
    expect(MOBILE_SHIM_SIGNIN_RATE_LIMIT.ipTier.limit).toBeGreaterThan(
      MOBILE_SHIM_SIGNIN_RATE_LIMIT.identifierTier.limit,
    );
  });

  it("namespaces its bucket away from the web login", () => {
    expect(MOBILE_SHIM_SIGNIN_RATE_LIMIT.identifierKeyPrefix).toBe("shim-auth:");
  });

  it("wires the credentials rate limiter onto the signin route", () => {
    const source = readFileSync(join(V1_ROOT, "auth/signin/route.ts"), "utf8");

    expect(source).toMatch(/withCredentialsRateLimit\s*\(/);
    expect(source).toContain("MOBILE_SHIM_SIGNIN_RATE_LIMIT");
  });
});

const SHOULD_RUN = process.env.RUN_LEGACY_INTEGRATION === "1";
const LEGACY_BASE = "http://localhost:8080/api/v1";
const POOLED_NEON_BCRYPT_COLD_START_TIMEOUT_MS = 20_000;
const GOLDEN_SETUP_TIMEOUT_MS = 45_000;

type UserRouteFn = (
  request: Request,
  context: { params: Promise<Record<string, string> | undefined> },
) => Promise<Response>;

const GOLDEN_ATHLETE_PROFILE = {
  id: 1001,
  isEnabled: true,
  username: "athlete@tdp.local",
  userRole: { id: 1, name: "USER" },
  userPlan: { id: 1, name: "General" },
  trainingLevel: { id: 2, name: "Pro" },
  firstName: "Golden",
  lastName: "Athlete",
  phoneNumber: "+1-555-0100",
  dateOfBirth: "1990-05-01",
  team: null,
};

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
  let getUserRoute: UserRouteFn;
  let updateUserRoute: UserRouteFn;
  let changePasswordRoute: UserRouteFn;
  let helpers: typeof ApiServerTestHelpers;
  let snapshotHelpers: typeof PublishedSnapshotHelpers;
  let getProgramRoute: (request: Request, context: typeof routeContext) => Promise<Response>;
  let athleteShimToken: string;
  let athleteLegacyToken: string;
  let individualShimToken: string;
  let individualLegacyToken: string;
  const createdUserIds: string[] = [];
  const programSnapshots: PublishedSnapshotHelpers.TestPublishedSnapshot[] = [];

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

  const authHeaders = (token: string): Record<string, string> =>
    token ? { Authorization: token } : {};

  const shimTokenFor = async (email: string, password: string): Promise<string> => {
    const probe = await hitShimSignin(JSON.stringify({ username: email, password }));

    return (JSON.parse(probe.body) as { accessToken: string }).accessToken;
  };

  const legacyTokenFor = async (email: string, password: string): Promise<string> => {
    const probe = await hitLegacySignin(JSON.stringify({ username: email, password }));

    return (JSON.parse(probe.body) as { accessToken: string }).accessToken;
  };

  const hitShimGetUser = async (id: number, token: string): Promise<Probe> => {
    const response = await getUserRoute(
      new Request(`http://localhost:3001/api/v1/user/${id}`, { headers: authHeaders(token) }),
      { params: Promise.resolve({ id: String(id) }) },
    );

    return { status: response.status, body: await response.text() };
  };

  const hitLegacyGetUser = async (id: number, token: string): Promise<Probe> => {
    const response = await fetch(`${LEGACY_BASE}/user/${id}`, { headers: authHeaders(token) });

    return { status: response.status, body: await response.text() };
  };

  const hitShimPutUser = async (body: string, token: string): Promise<Probe> => {
    const response = await updateUserRoute(
      new Request("http://localhost:3001/api/v1/user", {
        method: "PUT",
        headers: { "content-type": "application/json", ...authHeaders(token) },
        body,
      }),
      routeContext,
    );

    return { status: response.status, body: await response.text() };
  };

  const hitLegacyPutUser = async (body: string, token: string): Promise<Probe> => {
    const response = await fetch(`${LEGACY_BASE}/user`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...authHeaders(token) },
      body,
    });

    return { status: response.status, body: await response.text() };
  };

  const hitShimChangePassword = async (body: string, token: string): Promise<Probe> => {
    const response = await changePasswordRoute(
      new Request("http://localhost:3001/api/v1/user/changePassword", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...authHeaders(token) },
        body,
      }),
      routeContext,
    );

    return { status: response.status, body: await response.text() };
  };

  const hitLegacyChangePassword = async (body: string, token: string): Promise<Probe> => {
    const response = await fetch(`${LEGACY_BASE}/user/changePassword`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...authHeaders(token) },
      body,
    });

    return { status: response.status, body: await response.text() };
  };

  const GENERAL_TRAINING_DATE = "2026-08-15";
  const GENERAL_REST_DATE = "2026-08-16";
  const INDIVIDUAL_DATE = "2026-08-17";
  const NO_PROGRAM_DATE = "2026-08-18";

  const GENERAL_TRAINING_PROGRAM = {
    dayTrainings: [
      {
        trainingNumber: 1,
        blocks: [{ name: "STRENGTH", exercises: ["5 sets:\n3 bench presses"] }],
      },
    ],
  };
  const INDIVIDUAL_TRAINING_PROGRAM = {
    dayTrainings: [
      { trainingNumber: 1, blocks: [{ name: "WOD", exercises: ["21-15-9 thrusters"] }] },
    ],
  };

  const utcDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

  const hitShimGetProgram = async (
    userId: number,
    scheduledDate: string,
    token: string,
  ): Promise<Probe> => {
    const response = await getProgramRoute(
      new Request(
        `http://localhost:3001/api/v1/program?userId=${userId}&scheduledDate=${scheduledDate}`,
        { headers: authHeaders(token) },
      ),
      routeContext,
    );

    return { status: response.status, body: await response.text() };
  };

  const hitLegacyGetProgram = async (
    userId: number,
    scheduledDate: string,
    token: string,
  ): Promise<Probe> => {
    const response = await fetch(
      `${LEGACY_BASE}/program?userId=${userId}&scheduledDate=${scheduledDate}`,
      { headers: authHeaders(token) },
    );

    return { status: response.status, body: await response.text() };
  };

  const seedLegacyProgram = async (path: string, body: unknown, token: string): Promise<number> => {
    const response = await fetch(`${LEGACY_BASE}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: token },
      body: JSON.stringify(body),
    });

    if (response.status !== 200) {
      throw new Error(`legacy ${path} seed failed: ${response.status} ${await response.text()}`);
    }

    return (JSON.parse(await response.text()) as { id: number }).id;
  };

  beforeAll(async () => {
    loadPlatformEnv();

    const [
      signinModule,
      levelsModule,
      plansModule,
      getUserModule,
      updateUserModule,
      changePasswordModule,
      programModule,
      helpersModule,
      snapshotModule,
    ] = await Promise.all([
      import("../auth/signin/route"),
      import("../trainingLevel/all/route"),
      import("../userPlans/route"),
      import("../user/[id]/route"),
      import("../user/route"),
      import("../user/changePassword/route"),
      import("../program/route"),
      import("@repo/api-server/test-helpers"),
      import("@repo/api-server/test-helpers/published-snapshot"),
    ]);

    signinRoute = signinModule.POST;
    trainingLevelsRoute = levelsModule.GET;
    userPlansRoute = plansModule.GET;
    getUserRoute = getUserModule.GET;
    updateUserRoute = updateUserModule.PUT;
    changePasswordRoute = changePasswordModule.PATCH;
    getProgramRoute = programModule.GET;
    helpers = helpersModule;
    snapshotHelpers = snapshotModule;

    for (const fixture of helpers.GOLDEN_FIXTURE_USERS) {
      const existing = await helpers.cleanupRaw.user.findUnique({
        where: { email: fixture.email },
      });

      if (existing) {
        throw new Error(
          `Refusing to run: ${fixture.email} already exists in the database this test is ` +
            "pointed at. The golden seeds and then removes its own rows; deleting a row it " +
            "did not create would cascade through real data. Check DATABASE_URL in " +
            "apps/platform/.env.local, and remove the row by hand if it is a leftover.",
        );
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

    athleteShimToken = await shimTokenFor(helpers.GOLDEN_ATHLETE.email, helpers.GOLDEN_PASSWORD);
    athleteLegacyToken = await legacyTokenFor(
      helpers.GOLDEN_ATHLETE.email,
      helpers.GOLDEN_PASSWORD,
    );
    individualShimToken = await shimTokenFor(
      helpers.GOLDEN_INDIVIDUAL.email,
      helpers.GOLDEN_PASSWORD,
    );
    individualLegacyToken = await legacyTokenFor(
      helpers.GOLDEN_INDIVIDUAL.email,
      helpers.GOLDEN_PASSWORD,
    );

    const adminLegacyToken = await legacyTokenFor(
      helpers.GOLDEN_ADMIN.email,
      helpers.GOLDEN_PASSWORD,
    );
    const generalTrainingRowId = await seedLegacyProgram(
      "generalProgram",
      {
        trainingLevel: { id: helpers.GOLDEN_ATHLETE.legacyLevelId },
        scheduledDate: GENERAL_TRAINING_DATE,
        isRestDay: false,
        dailyProgram: GENERAL_TRAINING_PROGRAM,
      },
      adminLegacyToken,
    );
    const generalRestRowId = await seedLegacyProgram(
      "generalProgram",
      {
        trainingLevel: { id: helpers.GOLDEN_ATHLETE.legacyLevelId },
        scheduledDate: GENERAL_REST_DATE,
        isRestDay: true,
        dailyProgram: null,
      },
      adminLegacyToken,
    );
    const individualRowId = await seedLegacyProgram(
      "individualProgram",
      {
        userId: helpers.GOLDEN_INDIVIDUAL.legacyUserId,
        scheduledDate: INDIVIDUAL_DATE,
        isRestDay: false,
        dailyProgram: INDIVIDUAL_TRAINING_PROGRAM,
      },
      adminLegacyToken,
    );

    programSnapshots.push(
      await snapshotHelpers.createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: helpers.GOLDEN_ATHLETE.legacyLevelId,
        scheduledDate: utcDate(GENERAL_TRAINING_DATE),
        legacyRowId: generalTrainingRowId,
        isRestDay: false,
        dailyProgram: GENERAL_TRAINING_PROGRAM,
      }),
      await snapshotHelpers.createTestPublishedSnapshot({
        channel: "GENERAL",
        legacyLevelId: helpers.GOLDEN_ATHLETE.legacyLevelId,
        scheduledDate: utcDate(GENERAL_REST_DATE),
        legacyRowId: generalRestRowId,
        isRestDay: true,
        dailyProgram: null,
      }),
      await snapshotHelpers.createTestPublishedSnapshot({
        channel: "INDIVIDUAL",
        legacyUserId: helpers.GOLDEN_INDIVIDUAL.legacyUserId,
        scheduledDate: utcDate(INDIVIDUAL_DATE),
        legacyRowId: individualRowId,
        isRestDay: false,
        dailyProgram: INDIVIDUAL_TRAINING_PROGRAM,
      }),
    );
  }, GOLDEN_SETUP_TIMEOUT_MS);

  afterAll(async () => {
    if (!helpers) {
      return;
    }

    await helpers.cleanupRaw.mobileConnection.deleteMany({
      where: { id: { in: programSnapshots.map((snapshot) => snapshot.connectionId) } },
    });
    await helpers.cleanupRaw.trainingPlan.deleteMany({
      where: { id: { in: programSnapshots.map((snapshot) => snapshot.planId) } },
    });
    await helpers.cleanupRaw.user.deleteMany({
      where: {
        id: {
          in: programSnapshots.flatMap((snapshot) =>
            snapshot.athleteUserId
              ? [snapshot.coachUserId, snapshot.athleteUserId]
              : [snapshot.coachUserId],
          ),
        },
      },
    });

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

    expect(shim.status).toBe(200);
    expect(legacy.status).toBe(200);
    expect(shimJson.accessToken).toEqual(expect.any(String));
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

  it("matches the legacy failure for a username carrying a NUL byte", async () => {
    const body = JSON.stringify({
      username: `${helpers.GOLDEN_ATHLETE.email}${String.fromCharCode(0)}`,
      password: helpers.GOLDEN_PASSWORD,
    });
    const shim = await hitShimSignin(body);
    const legacy = await hitLegacySignin(body);

    expectSameFailure(shim, legacy);
    expect(shim.status).not.toBe(500);
  });

  it("matches the legacy refusal of a non-json content type", async () => {
    const body = JSON.stringify({
      username: helpers.GOLDEN_ATHLETE.email,
      password: helpers.GOLDEN_PASSWORD,
    });

    const shimResponse = await signinRoute(
      new Request("http://localhost:3001/api/v1/auth/signin", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body,
      }),
      routeContext,
    );
    const legacyResponse = await fetch(`${LEGACY_BASE}/auth/signin`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body,
    });

    expectSameFailure(
      { status: shimResponse.status, body: await shimResponse.text() },
      { status: legacyResponse.status, body: await legacyResponse.text() },
    );
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

  it("runs the credentials rate limiter inside the mounted signin chain", async () => {
    const previous = getRateLimiter();
    const allowAll: RateLimiterPort = {
      check: async (_key, limit) => ({
        allowed: true,
        limit,
        remaining: limit,
        resetAt: Date.now() + 60_000,
      }),
    };
    const denying: RateLimiterPort = {
      check: async (key, limit) => ({
        allowed: !key.startsWith("shim-auth:"),
        limit,
        remaining: 0,
        resetAt: Date.now() + 30_000,
      }),
    };

    setRateLimiter(denying);

    try {
      const probe = await hitShimSignin(
        JSON.stringify({
          username: helpers.GOLDEN_ATHLETE.email,
          password: helpers.GOLDEN_PASSWORD,
        }),
      );

      expect(probe.status).toBe(429);
    } finally {
      setRateLimiter(previous ?? allowAll);
    }
  });

  it("renders a mapping fault as 500, never the 403 that would sign the app out", async () => {
    const user = await helpers.createTestUser({
      email: `shim-catalog-miss-${crypto.randomUUID().slice(0, 8)}@test.local`,
      password: helpers.GOLDEN_BCRYPT_HASH,
    });

    createdUserIds.push(user.id);

    await helpers.createTestLegacyIdentity(user.id, {
      legacyUserId: helpers.mintTestLegacyUserId(),
      legacyRoleId: 77,
      legacyPlanId: 88,
      legacyLevelId: 2,
      isEnabled: true,
    });

    const probe = await hitShimSignin(
      JSON.stringify({ username: user.email, password: helpers.GOLDEN_PASSWORD }),
    );

    expect(probe.status).toBe(500);
    expect(probe.status).not.toBe(403);
  });

  it(
    "serves a byte-identical profile after an edit, shim and legacy alike",
    { timeout: POOLED_NEON_BCRYPT_COLD_START_TIMEOUT_MS },
    async () => {
      const body = JSON.stringify(GOLDEN_ATHLETE_PROFILE);
      const [shimPut, legacyPut] = await Promise.all([
        hitShimPutUser(body, athleteShimToken),
        hitLegacyPutUser(body, athleteLegacyToken),
      ]);

      expect(shimPut.status).toBe(200);
      expect(legacyPut.status).toBe(200);
      expect(canonicalize(JSON.parse(shimPut.body))).toEqual(
        canonicalize(JSON.parse(legacyPut.body)),
      );

      const [shimGet, legacyGet] = await Promise.all([
        hitShimGetUser(1001, athleteShimToken),
        hitLegacyGetUser(1001, athleteLegacyToken),
      ]);

      expect(shimGet.status).toBe(200);
      expect(legacyGet.status).toBe(200);
      expect(canonicalize(JSON.parse(shimGet.body))).toEqual(
        canonicalize(JSON.parse(legacyGet.body)),
      );
      expect(canonicalize(JSON.parse(shimGet.body))).toEqual(canonicalize(GOLDEN_ATHLETE_PROFILE));
    },
  );

  it("returns 404 for a profile id that is not the caller's, shim and legacy alike", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetUser(999999, athleteShimToken),
      hitLegacyGetUser(999999, athleteLegacyToken),
    ]);

    expect(shim.status).toBe(404);
    expect(legacy.status).toBe(404);
  });

  it("collapses a tokenless profile read to 403 on both, the sign-out signal", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetUser(1001, ""),
      hitLegacyGetUser(1001, ""),
    ]);

    expect(shim.status).toBe(403);
    expect(legacy.status).toBe(403);
  });

  it("rejects an edit whose body id is not the caller's with 404 on both", async () => {
    const body = JSON.stringify({ ...GOLDEN_ATHLETE_PROFILE, id: 999999 });
    const [shim, legacy] = await Promise.all([
      hitShimPutUser(body, athleteShimToken),
      hitLegacyPutUser(body, athleteLegacyToken),
    ]);

    expect(shim.status).toBe(404);
    expect(legacy.status).toBe(404);
  });

  it(
    "rejects a wrong old password with 401 on both, never the 403 sign-out",
    { timeout: POOLED_NEON_BCRYPT_COLD_START_TIMEOUT_MS },
    async () => {
      const body = JSON.stringify({
        userId: 1001,
        oldPassword: "WrongButLong123!",
        newPassword: "NewPassw0rd!23",
      });
      const [shim, legacy] = await Promise.all([
        hitShimChangePassword(body, athleteShimToken),
        hitLegacyChangePassword(body, athleteLegacyToken),
      ]);

      expect(shim.status).toBe(401);
      expect(shim.status).not.toBe(403);
      expect(legacy.status).toBe(401);
    },
  );

  it("rejects a reused password with 400 on both", async () => {
    const body = JSON.stringify({
      userId: 1001,
      oldPassword: helpers.GOLDEN_PASSWORD,
      newPassword: helpers.GOLDEN_PASSWORD,
    });
    const [shim, legacy] = await Promise.all([
      hitShimChangePassword(body, athleteShimToken),
      hitLegacyChangePassword(body, athleteLegacyToken),
    ]);

    expect(shim.status).toBe(400);
    expect(legacy.status).toBe(400);
  });

  it("rejects a new password below the platform minimum with 400 on both", async () => {
    const body = JSON.stringify({
      userId: 1001,
      oldPassword: helpers.GOLDEN_PASSWORD,
      newPassword: "abc",
    });
    const [shim, legacy] = await Promise.all([
      hitShimChangePassword(body, athleteShimToken),
      hitLegacyChangePassword(body, athleteLegacyToken),
    ]);

    expect(shim.status).toBe(400);
    expect(legacy.status).toBe(400);
  });

  it(
    "changes the password end-to-end on the shim and re-authenticates with the new one",
    { timeout: POOLED_NEON_BCRYPT_COLD_START_TIMEOUT_MS },
    async () => {
      const email = `shim-chpw-golden-${crypto.randomUUID().slice(0, 8)}@test.local`;
      const user = await helpers.createTestUser({ email, password: helpers.GOLDEN_BCRYPT_HASH });

      createdUserIds.push(user.id);

      const legacyUserId = helpers.mintTestLegacyUserId();

      await helpers.createTestLegacyIdentity(user.id, {
        legacyUserId,
        legacyRoleId: 1,
        legacyPlanId: 1,
        legacyLevelId: 2,
        isEnabled: true,
      });

      const token = await shimTokenFor(email, helpers.GOLDEN_PASSWORD);
      const changed = await hitShimChangePassword(
        JSON.stringify({
          userId: legacyUserId,
          oldPassword: helpers.GOLDEN_PASSWORD,
          newPassword: "NewPassw0rd!23",
        }),
        token,
      );

      expect(changed.status).toBe(200);
      expect(changed.body).toBe("");

      const reauth = await hitShimSignin(
        JSON.stringify({ username: email, password: "NewPassw0rd!23" }),
      );
      const stale = await hitShimSignin(
        JSON.stringify({ username: email, password: helpers.GOLDEN_PASSWORD }),
      );

      expect(reauth.status).toBe(200);
      expect(stale.status).toBe(403);
    },
  );

  it("closes the legacy GET IDOR: a foreign profile is 404 on the shim but 200 on legacy", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetUser(1002, athleteShimToken),
      hitLegacyGetUser(1002, athleteLegacyToken),
    ]);

    expect(shim.status).toBe(404);
    expect(legacy.status).toBe(200);
  });

  it("refuses to edit a foreign profile: shim 404 with no write to the shared admin row", async () => {
    const body = JSON.stringify({ ...GOLDEN_ATHLETE_PROFILE, id: 1002 });
    const shim = await hitShimPutUser(body, athleteShimToken);

    expect(shim.status).toBe(404);
  });

  it("requires a token for changePassword where legacy is permitAll", async () => {
    const body = JSON.stringify({
      userId: 1001,
      oldPassword: "WrongButLong123!",
      newPassword: "NewPassw0rd!23",
    });
    const shim = await hitShimChangePassword(body, "");
    const legacy = await hitLegacyChangePassword(body, "");

    expect(shim.status).toBe(403);
    expect(legacy.status).toBe(401);
  });

  it("serves a byte-identical general training day, shim and legacy alike", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(
        helpers.GOLDEN_ATHLETE.legacyUserId,
        GENERAL_TRAINING_DATE,
        athleteShimToken,
      ),
      hitLegacyGetProgram(
        helpers.GOLDEN_ATHLETE.legacyUserId,
        GENERAL_TRAINING_DATE,
        athleteLegacyToken,
      ),
    ]);

    expect(shim.status).toBe(200);
    expect(legacy.status).toBe(200);
    expect(canonicalize(JSON.parse(shim.body))).toEqual(canonicalize(JSON.parse(legacy.body)));
  });

  it("serves a byte-identical general rest day with a null dailyProgram, shim and legacy alike", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, GENERAL_REST_DATE, athleteShimToken),
      hitLegacyGetProgram(
        helpers.GOLDEN_ATHLETE.legacyUserId,
        GENERAL_REST_DATE,
        athleteLegacyToken,
      ),
    ]);

    expect(shim.status).toBe(200);
    expect(legacy.status).toBe(200);
    expect(canonicalize(JSON.parse(shim.body))).toEqual(canonicalize(JSON.parse(legacy.body)));
    expect(JSON.parse(shim.body)).toMatchObject({ isRestDay: true, dailyProgram: null });
  });

  it("serves a byte-identical individual day, shim and legacy alike", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(
        helpers.GOLDEN_INDIVIDUAL.legacyUserId,
        INDIVIDUAL_DATE,
        individualShimToken,
      ),
      hitLegacyGetProgram(
        helpers.GOLDEN_INDIVIDUAL.legacyUserId,
        INDIVIDUAL_DATE,
        individualLegacyToken,
      ),
    ]);

    expect(shim.status).toBe(200);
    expect(legacy.status).toBe(200);
    expect(canonicalize(JSON.parse(shim.body))).toEqual(canonicalize(JSON.parse(legacy.body)));
  });

  it("returns 404 for a date with no program, shim and legacy alike", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, NO_PROGRAM_DATE, athleteShimToken),
      hitLegacyGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, NO_PROGRAM_DATE, athleteLegacyToken),
    ]);

    expect(shim.status).toBe(404);
    expect(legacy.status).toBe(404);
  });

  it("closes the program IDOR: a foreign athlete's program is 404 on the shim but 200 on legacy", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(helpers.GOLDEN_INDIVIDUAL.legacyUserId, INDIVIDUAL_DATE, athleteShimToken),
      hitLegacyGetProgram(
        helpers.GOLDEN_INDIVIDUAL.legacyUserId,
        INDIVIDUAL_DATE,
        athleteLegacyToken,
      ),
    ]);

    expect(shim.status).toBe(404);
    expect(legacy.status).toBe(200);
  });

  it("collapses a malformed scheduledDate to 403 empty on both, the sign-out signal", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, "not-a-date", athleteShimToken),
      hitLegacyGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, "not-a-date", athleteLegacyToken),
    ]);

    expectSameFailure(shim, legacy);
  });

  it("collapses a tokenless program read to 403 on both", async () => {
    const [shim, legacy] = await Promise.all([
      hitShimGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, GENERAL_TRAINING_DATE, ""),
      hitLegacyGetProgram(helpers.GOLDEN_ATHLETE.legacyUserId, GENERAL_TRAINING_DATE, ""),
    ]);

    expect(shim.status).toBe(403);
    expect(legacy.status).toBe(403);
  });
});
