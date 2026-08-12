import { describe, expect, it } from "vitest";

import type { LegacyShimIdentity } from "@repo/api-routes/legacy-shim";

import type { MobileCompatApi } from "./create-mobile-compat-api";
import { LEGACY_TRAINING_LEVELS, LEGACY_USER_PLANS } from "./legacy-catalogs";
import { createMobileCompatRoutes } from "./wire-handlers";
import type { LegacyGeneralProgramDto, LegacyUserDto } from "./wire-schemas";

const context = { params: Promise.resolve(undefined) };

const NUL = String.fromCharCode(0);

const KNOWN_LEGACY_ID = 1001;

const KNOWN_DATE = "2026-08-15";

const identity: LegacyShimIdentity = {
  userId: "ckuser0000000000000000000",
  legacyUserId: KNOWN_LEGACY_ID,
  legacyRoleId: 1,
  legacyPlanId: 1,
  legacyLevelId: 2,
};

const userDto: LegacyUserDto = {
  id: KNOWN_LEGACY_ID,
  isEnabled: true,
  username: "athlete@tdp.local",
  userRole: { id: 1, name: "USER" },
  userPlan: { id: 1, name: "General" },
  trainingLevel: { id: 2, name: "Pro" },
  firstName: "Denys",
  lastName: "Sergeev",
  phoneNumber: "+15551234567",
  dateOfBirth: "1990-05-01",
  team: null,
};

const generalProgramDto: LegacyGeneralProgramDto = {
  id: 42,
  scheduledDate: KNOWN_DATE,
  trainingLevel: { id: 2, name: "Pro" },
  isRestDay: false,
  dailyProgram: {
    dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "STRENGTH", exercises: ["3 bench"] }] }],
  },
};

const api: MobileCompatApi = {
  signin: async () => ({
    kind: "ok",
    payload: {
      userId: KNOWN_LEGACY_ID,
      accessToken: "token",
      userRole: { id: 1, name: "USER" },
      userPlan: { id: 1, name: "General" },
    },
  }),
  listTrainingLevels: () => LEGACY_TRAINING_LEVELS,
  listUserPlans: () => LEGACY_USER_PLANS,
  getUser: async (_identity, id) =>
    id === KNOWN_LEGACY_ID ? { kind: "ok-json", payload: userDto } : { kind: "not-found" },
  updateUser: async (_identity, input) => ({
    kind: "ok-json",
    payload: { ...userDto, id: input.id },
  }),
  changePassword: async () => ({ kind: "ok-empty" }),
  getProgram: async (_identity, userId, scheduledDate) =>
    userId === KNOWN_LEGACY_ID && scheduledDate === KNOWN_DATE
      ? { kind: "ok-json", payload: generalProgramDto }
      : { kind: "not-found" },
};

const routes = createMobileCompatRoutes(api);

const signinRequest = (body: string, contentType: string | null = "application/json"): Request =>
  new Request("http://localhost/api/v1/auth/signin", {
    method: "POST",
    ...(contentType === null ? {} : { headers: { "content-type": contentType } }),
    body,
  });

const post = async (body: string, contentType?: string | null) => {
  const response = await routes.signin(signinRequest(body, contentType), context);

  return { status: response.status, body: await response.text() };
};

const validBody = JSON.stringify({ username: "athlete@tdp.local", password: "Admin123!" });

describe("mobile compat signin wire handler", () => {
  it("returns 200 for a well-formed json request", async () => {
    expect((await post(validBody)).status).toBe(200);
  });

  it.each([
    ["malformed json", "not-json"],
    ["empty body", ""],
    ["an array body", "[]"],
    ["a bare string body", '"hello"'],
    ["json null", "null"],
    ["missing fields", "{}"],
    ["a null password", JSON.stringify({ username: "a@b.c", password: null })],
    ["a null username", JSON.stringify({ username: null, password: "x" })],
    ["a numeric username", JSON.stringify({ username: 1, password: "x" })],
    ["an object username", JSON.stringify({ username: {}, password: "x" })],
  ])("denies %s without ever emitting 400", async (_label, body) => {
    const result = await post(body);

    expect(result.status).toBe(403);
    expect(result.body).toBe("");
  });

  it("denies a username carrying a NUL byte instead of letting it reach the database", async () => {
    const result = await post(
      JSON.stringify({ username: `athlete@tdp.local${NUL}`, password: "Admin123!" }),
    );

    expect(result.status).toBe(403);
    expect(result.body).toBe("");
  });

  it("denies any control character in the username, which is what reaches the database", async () => {
    const tab = String.fromCharCode(9);

    expect((await post(JSON.stringify({ username: `a${tab}b`, password: "x" }))).status).toBe(403);
    expect((await post(JSON.stringify({ username: `a${NUL}b`, password: "x" }))).status).toBe(403);
  });

  it("accepts a control character in the password, which only ever reaches bcrypt", async () => {
    const result = await post(JSON.stringify({ username: "a@b.c", password: `x${NUL}` }));

    expect(result.status).toBe(200);
  });

  it.each([
    ["a leading lone surrogate", String.fromCharCode(0xd800)],
    ["a trailing lone surrogate", String.fromCharCode(0xdc00)],
  ])("denies a username with %s, which Postgres cannot store", async (_label, surrogate) => {
    const result = await post(JSON.stringify({ username: `athlete${surrogate}`, password: "x" }));

    expect(result.status).toBe(403);
    expect(result.body).toBe("");
  });

  it("denies a username longer than the legacy column can hold", async () => {
    const result = await post(JSON.stringify({ username: "a".repeat(101), password: "x" }));

    expect(result.status).toBe(403);
    expect(result.body).toBe("");
  });

  it("passes a valid astral-plane emoji username through to the service", async () => {
    const result = await post(JSON.stringify({ username: "\u{1F4AA}@tdp.local", password: "x" }));

    expect(result.status).toBe(200);
  });

  it.each([
    ["no content-type", null],
    ["text/plain", "text/plain"],
    ["form-urlencoded", "application/x-www-form-urlencoded"],
  ])("denies a request sent as %s, as the legacy stack does", async (_label, contentType) => {
    const result = await post(validBody, contentType);

    expect(result.status).toBe(403);
    expect(result.body).toBe("");
  });

  it("accepts a charset-qualified json content-type", async () => {
    expect((await post(validBody, "application/json; charset=utf-8")).status).toBe(200);
  });

  it("passes unicode credentials through to the service", async () => {
    const result = await post(JSON.stringify({ username: "атлет@tdp.local", password: "пароль" }));

    expect(result.status).toBe(200);
  });
});

describe("mobile compat catalog wire handlers", () => {
  it("serves the training levels as a 200 json array in id order", async () => {
    const response = await routes.trainingLevels(
      new Request("http://localhost/api/v1/trainingLevel/all"),
      context,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual([
      { id: 1, name: "Scaled" },
      { id: 2, name: "Pro" },
      { id: 3, name: "Advanced" },
      { id: 4, name: "Functional Bodybuilding" },
    ]);
  });

  it("serves the user plans as a 200 json array in id order", async () => {
    const response = await routes.userPlans(
      new Request("http://localhost/api/v1/userPlans"),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: 1, name: "General" },
      { id: 2, name: "Individual" },
    ]);
  });
});

describe("mobile compat get user wire handler", () => {
  const hitGetUser = (id: string): Promise<Response> =>
    routes.getUser(
      new Request(`http://localhost/api/v1/user/${id}`),
      { params: Promise.resolve({ id }) },
      identity,
    );

  it("renders an ok-json outcome as 200 with the dto", async () => {
    const response = await hitGetUser(String(KNOWN_LEGACY_ID));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: KNOWN_LEGACY_ID,
      username: "athlete@tdp.local",
    });
  });

  it("renders a not-found outcome as 404", async () => {
    expect((await hitGetUser("2002")).status).toBe(404);
  });

  it("rejects a non-numeric id with 404, never the 403 that signs the caller out", async () => {
    const response = await hitGetUser("abc");

    expect(response.status).toBe(404);
    expect(response.status).not.toBe(403);
  });
});

describe("mobile compat update user wire handler", () => {
  const hitUpdateUser = (body: string): Promise<Response> =>
    routes.updateUser(
      new Request("http://localhost/api/v1/user", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      }),
      context,
      identity,
    );

  it("renders an ok-json outcome as 200 for a well-formed body", async () => {
    const response = await hitUpdateUser(
      JSON.stringify({
        id: KNOWN_LEGACY_ID,
        firstName: "A",
        lastName: "B",
        phoneNumber: "5",
        dateOfBirth: "1990-05-01",
      }),
    );

    expect(response.status).toBe(200);
  });

  it.each([
    ["malformed json", "not-json"],
    ["json null", "null"],
    ["a bad date of birth", JSON.stringify({ id: 1001, dateOfBirth: "not-a-date" })],
    ["a missing id", JSON.stringify({ firstName: "A" })],
  ])("rejects %s with 400, never 403", async (_label, body) => {
    const response = await hitUpdateUser(body);

    expect(response.status).toBe(400);
    expect(response.status).not.toBe(403);
  });
});

describe("mobile compat change password wire handler", () => {
  const hitChangePassword = (body: string): Promise<Response> =>
    routes.changePassword(
      new Request("http://localhost/api/v1/user/changePassword", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body,
      }),
      context,
      identity,
    );

  it("renders an ok-empty outcome as 200 with an empty body, never 204", async () => {
    const response = await hitChangePassword(
      JSON.stringify({
        userId: KNOWN_LEGACY_ID,
        oldPassword: "old",
        newPassword: "NewPassw0rd!23",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(204);
    expect(await response.text()).toBe("");
  });

  it.each([
    ["malformed json", "not-json"],
    ["a missing field", JSON.stringify({ userId: 1001, oldPassword: "x" })],
  ])("rejects %s with 400, never 403", async (_label, body) => {
    const response = await hitChangePassword(body);

    expect(response.status).toBe(400);
    expect(response.status).not.toBe(403);
  });
});

describe("mobile compat get program wire handler", () => {
  const hitGetProgram = (query: string): Promise<Response> =>
    routes.getProgram(new Request(`http://localhost/api/v1/program${query}`), context, identity);

  it("renders an ok-json outcome as 200 with the program dto", async () => {
    const response = await hitGetProgram(`?userId=${KNOWN_LEGACY_ID}&scheduledDate=${KNOWN_DATE}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toMatchObject({ id: 42, isRestDay: false });
  });

  it("renders a not-found outcome as 404 for a date with no program", async () => {
    expect(
      (await hitGetProgram(`?userId=${KNOWN_LEGACY_ID}&scheduledDate=2099-01-01`)).status,
    ).toBe(404);
  });

  it.each([
    ["a missing userId", `?scheduledDate=${KNOWN_DATE}`],
    ["a missing scheduledDate", `?userId=${KNOWN_LEGACY_ID}`],
    ["both params missing", ""],
    ["an empty userId", `?userId=&scheduledDate=${KNOWN_DATE}`],
    ["a non-numeric userId", `?userId=abc&scheduledDate=${KNOWN_DATE}`],
    ["a negative userId", `?userId=-5&scheduledDate=${KNOWN_DATE}`],
    ["a malformed scheduledDate", `?userId=${KNOWN_LEGACY_ID}&scheduledDate=not-a-date`],
    ["an out-of-range scheduledDate", `?userId=${KNOWN_LEGACY_ID}&scheduledDate=2026-13-40`],
  ])(
    "denies %s with a 403 empty body, never the shim's natural 400 or a business 404",
    async (_label, query) => {
      const response = await hitGetProgram(query);

      expect(response.status).toBe(403);
      expect(await response.text()).toBe("");
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(404);
    },
  );
});
