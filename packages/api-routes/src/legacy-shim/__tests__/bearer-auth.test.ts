import { describe, expect, it, vi } from "vitest";

import { createMobileBearerAuth } from "../bearer-auth";
import type { LegacyShimIdentity, LegacyShimResolution } from "../types";

const IDENTITY: LegacyShimIdentity = {
  userId: "cuid-1",
  legacyUserId: 1001,
  legacyRoleId: 1,
  legacyPlanId: 1,
  legacyLevelId: 2,
};

const context = { params: Promise.resolve(undefined) };

const requestWith = (headers: Record<string, string>): Request =>
  new Request("http://localhost/api/v1/user", { headers });

const authenticated: LegacyShimResolution = { kind: "authenticated", identity: IDENTITY };
const denied: LegacyShimResolution = { kind: "denied" };

describe("createMobileBearerAuth", () => {
  it("hands the resolved identity to the handler on success", async () => {
    const handler = vi.fn(async () => new Response("ok", { status: 200 }));
    const route = createMobileBearerAuth(async () => authenticated)(handler);

    const response = await route(requestWith({ authorization: "tok" }), context);

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0]?.[2]).toEqual(IDENTITY);
  });

  it("denies with 403 and an empty body when the header is missing", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const route = createMobileBearerAuth(async () => authenticated)(handler);

    const response = await route(requestWith({}), context);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("");
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not call the resolver at all when there is no token", async () => {
    const resolve = vi.fn(async () => authenticated);
    const route = createMobileBearerAuth(resolve)(async () => new Response("ok"));

    await route(requestWith({}), context);

    expect(resolve).not.toHaveBeenCalled();
  });

  it("denies with 403 when the resolver rejects the token", async () => {
    const handler = vi.fn(async () => new Response("ok"));
    const route = createMobileBearerAuth(async () => denied)(handler);

    const response = await route(requestWith({ authorization: "bad" }), context);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("");
    expect(handler).not.toHaveBeenCalled();
  });

  it("never renders 403 for an infrastructure fault, because 403 signs the app out", async () => {
    const route = createMobileBearerAuth(async () => {
      throw new Error("database unreachable");
    })(async () => new Response("ok"));

    const response = await route(requestWith({ authorization: "tok" }), context);

    expect(response.status).not.toBe(403);
    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("never renders 403 when the handler itself faults", async () => {
    const route = createMobileBearerAuth(async () => authenticated)(async () => {
      throw new Error("boom");
    });

    const response = await route(requestWith({ authorization: "tok" }), context);

    expect(response.status).not.toBe(403);
    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("passes a Bearer-prefixed token through to the resolver unprefixed", async () => {
    const resolve = vi.fn(async () => authenticated);
    const route = createMobileBearerAuth(resolve)(async () => new Response("ok"));

    await route(requestWith({ authorization: "Bearer tok.value" }), context);

    expect(resolve).toHaveBeenCalledWith("tok.value");
  });
});
