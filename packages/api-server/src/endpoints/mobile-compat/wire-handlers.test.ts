import { describe, expect, it } from "vitest";

import type { MobileCompatApi } from "./create-mobile-compat-api";
import { LEGACY_TRAINING_LEVELS, LEGACY_USER_PLANS } from "./legacy-catalogs";
import { createMobileCompatRoutes } from "./wire-handlers";

const context = { params: Promise.resolve(undefined) };

const NUL = String.fromCharCode(0);

const api: MobileCompatApi = {
  signin: async () => ({
    kind: "ok",
    payload: {
      userId: 1001,
      accessToken: "token",
      userRole: { id: 1, name: "USER" },
      userPlan: { id: 1, name: "General" },
    },
  }),
  listTrainingLevels: () => LEGACY_TRAINING_LEVELS,
  listUserPlans: () => LEGACY_USER_PLANS,
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
