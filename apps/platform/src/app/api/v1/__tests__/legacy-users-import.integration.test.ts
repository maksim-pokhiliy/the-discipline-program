// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type * as ApiServerTestHelpers from "@repo/api-server/test-helpers";

const SHOULD_RUN = process.env.RUN_LEGACY_IMPORT_CHECK === "1";
const SETUP_TIMEOUT_MS = 120_000;

const GOLDEN_PASSWORD = "Admin123!";
const GOLDEN_BCRYPT_HASH = "$2a$10$xGFVeUFmZ9fBD3ihEPQZt.bl85fgMvCX0kdxA71xYpPDT4f72oiAy";

const LEGACY_LEVEL_PRO = 2;
const LEGACY_PLAN_GENERAL = 1;
const LEGACY_ROLE_USER = 1;

const V1_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLATFORM_ROOT = join(V1_ROOT, "../../../..");
const REPO_ROOT = join(PLATFORM_ROOT, "../..");
const API_SERVER_ROOT = join(REPO_ROOT, "packages/api-server");

const routeContext = { params: Promise.resolve(undefined) };

type Probe = { status: number; body: string };
type RouteFn = (request: Request, context: typeof routeContext) => Promise<Response>;
type UserRouteFn = (
  request: Request,
  context: { params: Promise<Record<string, string> | undefined> },
) => Promise<Response>;

type LegacyRow = {
  id: number;
  username: string;
  password: string;
  user_role_id: number;
  training_level_id: number;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  team_id: number | null;
  user_plan_id: number;
  is_enabled: boolean;
};

const loadPlatformEnv = (): void => {
  try {
    process.loadEnvFile(join(PLATFORM_ROOT, ".env.local"));
  } catch {
    throw new Error(
      "apps/platform/.env.local is required: it supplies DATABASE_URL and MOBILE_SHIM_JWT_SECRET.",
    );
  }
};

const requireDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl === "") {
    throw new Error("DATABASE_URL is required to run the legacy import probe.");
  }

  return databaseUrl;
};

describe.skipIf(!SHOULD_RUN)("legacy users import vertical", () => {
  let signinRoute: RouteFn;
  let getUserRoute: UserRouteFn;
  let helpers: typeof ApiServerTestHelpers;
  let workDir: string;
  let sourcePath: string;
  let databaseUrl: string;
  let enabledLegacyId: number;
  let disabledLegacyId: number;
  let firstReport: string;
  let secondReport: string;

  const runImportCli = (): string =>
    execFileSync(
      join(API_SERVER_ROOT, "node_modules/.bin/tsx"),
      [
        join(API_SERVER_ROOT, "scripts/legacy-users-import.ts"),
        `--source=${sourcePath}`,
        "--write",
        `--expect-host=${new URL(databaseUrl).hostname}`,
      ],
      {
        cwd: API_SERVER_ROOT,
        encoding: "utf8",
        env: { ...process.env, DATABASE_URL: databaseUrl },
      },
    );

  const hitSignin = async (username: string, password: string): Promise<Probe> => {
    const response = await signinRoute(
      new Request("http://localhost:3001/api/v1/auth/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
      routeContext,
    );

    return { status: response.status, body: await response.text() };
  };

  const hitGetUser = async (id: number, accessToken: string): Promise<Probe> => {
    const response = await getUserRoute(
      new Request(`http://localhost:3001/api/v1/user/${id}`, {
        headers: { Authorization: accessToken },
      }),
      { params: Promise.resolve({ id: String(id) }) },
    );

    return { status: response.status, body: await response.text() };
  };

  beforeAll(async () => {
    loadPlatformEnv();
    databaseUrl = requireDatabaseUrl();

    const [signinModule, userModule, helpersModule] = await Promise.all([
      import("../auth/signin/route"),
      import("../user/[id]/route"),
      import("@repo/api-server/test-helpers"),
    ]);

    signinRoute = signinModule.POST;
    getUserRoute = userModule.GET;
    helpers = helpersModule;

    enabledLegacyId = helpers.mintTestLegacyUserId();
    disabledLegacyId = enabledLegacyId + 1;

    const rows: LegacyRow[] = [
      {
        id: enabledLegacyId,
        username: `probe-${enabledLegacyId}@tdp.local`,
        password: GOLDEN_BCRYPT_HASH,
        user_role_id: LEGACY_ROLE_USER,
        training_level_id: LEGACY_LEVEL_PRO,
        first_name: "Probe",
        last_name: "Athlete",
        phone_number: "",
        date_of_birth: "1990-05-04",
        team_id: null,
        user_plan_id: LEGACY_PLAN_GENERAL,
        is_enabled: true,
      },
      {
        id: disabledLegacyId,
        username: `probe-${disabledLegacyId}@tdp.local`,
        password: GOLDEN_BCRYPT_HASH,
        user_role_id: LEGACY_ROLE_USER,
        training_level_id: LEGACY_LEVEL_PRO,
        first_name: null,
        last_name: null,
        phone_number: null,
        date_of_birth: null,
        team_id: null,
        user_plan_id: LEGACY_PLAN_GENERAL,
        is_enabled: false,
      },
    ];

    workDir = mkdtempSync(join(tmpdir(), "legacy-import-probe-"));
    sourcePath = join(workDir, "users.json");
    writeFileSync(sourcePath, JSON.stringify(rows), "utf8");

    firstReport = runImportCli();
    secondReport = runImportCli();
  }, SETUP_TIMEOUT_MS);

  afterAll(async () => {
    const identities = await helpers.cleanupRaw.mobileLegacyIdentity.findMany({
      where: { legacyUserId: { in: [enabledLegacyId, disabledLegacyId] } },
      select: { userId: true },
    });

    await helpers.cleanup(...identities.map((row) => ({ table: "user", id: row.userId })));

    rmSync(workDir, { recursive: true, force: true });
  });

  it("creates both legacy accounts on the first apply", () => {
    expect(firstReport).toContain("APPLIED");
    expect(firstReport).toContain("create 2");
  });

  it("signs the enabled athlete in with the password they had in the legacy app", async () => {
    const probe = await hitSignin(`probe-${enabledLegacyId}@tdp.local`, GOLDEN_PASSWORD);

    expect(probe.status).toBe(200);

    const payload: unknown = JSON.parse(probe.body);

    expect(payload).toMatchObject({ userId: enabledLegacyId });
    expect(typeof (payload as { userId: unknown }).userId).toBe("number");
  });

  it("serves the mirrored legacy profile back through GET /user/{id}", async () => {
    const signin = await hitSignin(`probe-${enabledLegacyId}@tdp.local`, GOLDEN_PASSWORD);
    const { accessToken } = JSON.parse(signin.body) as { accessToken: string };
    const probe = await hitGetUser(enabledLegacyId, accessToken);

    expect(probe.status).toBe(200);
    expect(JSON.parse(probe.body)).toMatchObject({
      id: enabledLegacyId,
      username: `probe-${enabledLegacyId}@tdp.local`,
      isEnabled: true,
      firstName: "Probe",
      lastName: "Athlete",
      phoneNumber: "",
      dateOfBirth: "1990-05-04",
      trainingLevel: { id: LEGACY_LEVEL_PRO },
      userPlan: { id: LEGACY_PLAN_GENERAL },
      userRole: { id: LEGACY_ROLE_USER },
    });
  });

  it("refuses the account the legacy dump had disabled", async () => {
    const probe = await hitSignin(`probe-${disabledLegacyId}@tdp.local`, GOLDEN_PASSWORD);

    expect(probe.status).toBe(403);
  });

  it("upgrades the imported cost-10 hash the first time the athlete signs in", async () => {
    const identity = await helpers.cleanupRaw.mobileLegacyIdentity.findUnique({
      where: { legacyUserId: enabledLegacyId },
      select: { userId: true },
    });
    const stored = await helpers.cleanupRaw.user.findUnique({
      where: { id: identity?.userId ?? "" },
      select: { password: true },
    });

    expect(stored?.password).not.toBe(GOLDEN_BCRYPT_HASH);
    expect(stored?.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it("creates nothing on a second apply and reports every row as a refresh", () => {
    expect(secondReport).toContain("create 0");
    expect(secondReport).toContain("refresh 2");
    expect(secondReport).toContain("no change");
  });

  it("never prints a hash or a hostname in either report", () => {
    for (const report of [firstReport, secondReport]) {
      expect(report).not.toContain(GOLDEN_BCRYPT_HASH);
      expect(report).not.toContain("$2a$");
      expect(report).not.toContain(new URL(databaseUrl).hostname);
    }
  });
});
