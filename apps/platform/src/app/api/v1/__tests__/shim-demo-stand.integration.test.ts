// @vitest-environment node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import type * as ApiServerTestHelpers from "@repo/api-server/test-helpers";

const SHOULD_RUN = process.env.RUN_SHIM_DEMO_CHECK === "1";
const DEMO_ATHLETE_EMAIL = "demo-athlete@thedisciplineprogram.com";
const DEMO_LEGACY_USER_ID = 990001;
const SETUP_TIMEOUT_MS = 45_000;

const V1_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLATFORM_ROOT = join(V1_ROOT, "../../../..");

const routeContext = { params: Promise.resolve(undefined) };

type Probe = { status: number; body: string };
type RouteFn = (request: Request, context: typeof routeContext) => Promise<Response>;
type UserRouteFn = (
  request: Request,
  context: { params: Promise<Record<string, string> | undefined> },
) => Promise<Response>;

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const loadPlatformEnv = (): void => {
  try {
    process.loadEnvFile(join(PLATFORM_ROOT, ".env.local"));
  } catch {
    throw new Error(
      "apps/platform/.env.local is required: it supplies DATABASE_URL and MOBILE_SHIM_JWT_SECRET.",
    );
  }
};

const requireDemoPassword = (): string => {
  const password = process.env.SHIM_DEMO_ATHLETE_PASSWORD;

  if (password === undefined || password.trim() === "") {
    throw new Error(
      "SHIM_DEMO_ATHLETE_PASSWORD is required: it must match the value the seed script ran with.",
    );
  }

  return password;
};

describe.skipIf(!SHOULD_RUN)("shim demo stand", () => {
  let signinRoute: RouteFn;
  let getProgramRoute: RouteFn;
  let getUserRoute: UserRouteFn;
  let helpers: typeof ApiServerTestHelpers;
  let accessToken: string;
  let signinPayload: unknown;
  let trainingDate: string;
  let restDate: string;

  const hitSignin = async (body: string): Promise<Probe> => {
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

  const hitGetProgram = async (scheduledDate: string): Promise<Probe> => {
    const response = await getProgramRoute(
      new Request(
        `http://localhost:3001/api/v1/program?userId=${DEMO_LEGACY_USER_ID}&scheduledDate=${scheduledDate}`,
        { headers: { Authorization: accessToken } },
      ),
      routeContext,
    );

    return { status: response.status, body: await response.text() };
  };

  const hitGetUser = async (id: number): Promise<Probe> => {
    const response = await getUserRoute(
      new Request(`http://localhost:3001/api/v1/user/${id}`, {
        headers: { Authorization: accessToken },
      }),
      { params: Promise.resolve({ id: String(id) }) },
    );

    return { status: response.status, body: await response.text() };
  };

  const discoverWindowDates = async (): Promise<void> => {
    const link = await helpers.cleanupRaw.mobilePublishLink.findFirst({
      where: { channel: "INDIVIDUAL", legacyUserId: DEMO_LEGACY_USER_ID },
      select: { id: true },
    });

    if (!link) {
      throw new Error(
        `no INDIVIDUAL publish link for legacyUserId ${DEMO_LEGACY_USER_ID}; run shim-demo-seed first.`,
      );
    }

    const days = await helpers.cleanupRaw.mobilePublishedDay.findMany({
      where: {
        linkId: link.id,
        scheduledDate: { gte: new Date(`${toIsoDate(new Date())}T00:00:00.000Z`) },
      },
      orderBy: { scheduledDate: "asc" },
      select: { scheduledDate: true, isRestDay: true },
    });
    const training = days.find((day) => day.isRestDay === false);
    const rest = days.find((day) => day.isRestDay === true);

    if (!training || !rest) {
      throw new Error(
        `the seeded window needs both a training and a rest day from today onward; found ${days.length} days.`,
      );
    }

    trainingDate = toIsoDate(training.scheduledDate);
    restDate = toIsoDate(rest.scheduledDate);
  };

  beforeAll(async () => {
    loadPlatformEnv();

    const [signinModule, programModule, userModule, helpersModule] = await Promise.all([
      import("../auth/signin/route"),
      import("../program/route"),
      import("../user/[id]/route"),
      import("@repo/api-server/test-helpers"),
    ]);

    signinRoute = signinModule.POST;
    getProgramRoute = programModule.GET;
    getUserRoute = userModule.GET;
    helpers = helpersModule;

    const probe = await hitSignin(
      JSON.stringify({ username: DEMO_ATHLETE_EMAIL, password: requireDemoPassword() }),
    );

    if (probe.status !== 200) {
      throw new Error(`demo signin failed with ${probe.status}; re-run shim-demo-seed.`);
    }

    signinPayload = JSON.parse(probe.body);
    accessToken = (signinPayload as { accessToken: string }).accessToken;

    await discoverWindowDates();
  }, SETUP_TIMEOUT_MS);

  it("signs the demo athlete in and reports the synthetic legacy id", () => {
    expect(signinPayload).toMatchObject({
      userId: DEMO_LEGACY_USER_ID,
      userRole: { id: 1, name: "USER" },
      userPlan: { id: 2, name: "Individual" },
    });
    expect(accessToken).toEqual(expect.any(String));
  });

  it("serves a training day whose exercise text carries that day's date", async () => {
    const probe = await hitGetProgram(trainingDate);

    expect(probe.status).toBe(200);

    const payload = JSON.parse(probe.body) as {
      id: number;
      userId: number;
      scheduledDate: string;
      isRestDay: boolean;
      dailyProgram: { dayTrainings: { blocks: { exercises: string[] }[] }[] };
    };

    expect(payload).toMatchObject({
      userId: DEMO_LEGACY_USER_ID,
      scheduledDate: trainingDate,
      isRestDay: false,
    });
    expect(payload.dailyProgram.dayTrainings.at(0)?.blocks.at(0)?.exercises.at(0)).toBe(
      `Session date: ${trainingDate}`,
    );
  });

  it("serves a rest day as a null dailyProgram", async () => {
    const probe = await hitGetProgram(restDate);

    expect(probe.status).toBe(200);
    expect(JSON.parse(probe.body)).toMatchObject({
      userId: DEMO_LEGACY_USER_ID,
      scheduledDate: restDate,
      isRestDay: true,
      dailyProgram: null,
    });
  });

  it("serves the demo profile the app's user screen renders", async () => {
    const probe = await hitGetUser(DEMO_LEGACY_USER_ID);

    expect(probe.status).toBe(200);
    expect(JSON.parse(probe.body)).toMatchObject({
      id: DEMO_LEGACY_USER_ID,
      isEnabled: true,
      username: DEMO_ATHLETE_EMAIL,
      firstName: "Demo",
      lastName: "Athlete",
      trainingLevel: { id: 2, name: "Pro" },
      team: null,
    });
  });
});
