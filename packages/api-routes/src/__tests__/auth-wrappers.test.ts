import { type NextAuthOptions } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import type { RouteContext } from "../types";

const getServerSessionMock = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

const { createAuthWrappers } = await import("../auth-wrappers");

const fakeAuthOptions = {} as NextAuthOptions;
const wrappers = createAuthWrappers(fakeAuthOptions);

const emptyContext: RouteContext = { params: Promise.resolve({}) };
const buildRequest = (): Request => new Request("https://example.com/api/test");

const setSession = (role: UserRole | null): void => {
  if (role === null) {
    getServerSessionMock.mockResolvedValueOnce(null);

    return;
  }

  getServerSessionMock.mockResolvedValueOnce({
    user: { id: "user-1", role },
  });
};

const okHandler = vi.fn(
  async (_request: Request, _context: RouteContext, _userId: string) =>
    new Response(null, { status: 204 }),
);

beforeEach(() => {
  getServerSessionMock.mockReset();
  okHandler.mockClear();
});

describe("withAdminAuth (HEAD_COACH widening)", () => {
  it("returns 401 when no session", async () => {
    setSession(null);
    const handler = wrappers.withAdminAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(401);
    expect(okHandler).not.toHaveBeenCalled();
  });

  it("admits ADMIN", async () => {
    setSession(UserRole.ADMIN);
    const handler = wrappers.withAdminAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(204);
    expect(okHandler).toHaveBeenCalledWith(expect.any(Request), emptyContext, "user-1");
  });

  it("admits HEAD_COACH", async () => {
    setSession(UserRole.HEAD_COACH);
    const handler = wrappers.withAdminAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(204);
    expect(okHandler).toHaveBeenCalledWith(expect.any(Request), emptyContext, "user-1");
  });

  it("rejects COACH with 403", async () => {
    setSession(UserRole.COACH);
    const handler = wrappers.withAdminAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(403);
    expect(okHandler).not.toHaveBeenCalled();
  });

  it("rejects ATHLETE with 403", async () => {
    setSession(UserRole.ATHLETE);
    const handler = wrappers.withAdminAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(403);
    expect(okHandler).not.toHaveBeenCalled();
  });
});

describe("withCoachAuth (HEAD_COACH widening)", () => {
  it("returns 401 when no session", async () => {
    setSession(null);
    const handler = wrappers.withCoachAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(401);
    expect(okHandler).not.toHaveBeenCalled();
  });

  it("admits COACH", async () => {
    setSession(UserRole.COACH);
    const handler = wrappers.withCoachAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(204);
  });

  it("admits ADMIN", async () => {
    setSession(UserRole.ADMIN);
    const handler = wrappers.withCoachAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(204);
  });

  it("admits HEAD_COACH", async () => {
    setSession(UserRole.HEAD_COACH);
    const handler = wrappers.withCoachAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(204);
  });

  it("rejects ATHLETE with 403", async () => {
    setSession(UserRole.ATHLETE);
    const handler = wrappers.withCoachAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(403);
    expect(okHandler).not.toHaveBeenCalled();
  });
});

describe("withPlatformAuth", () => {
  it("returns 401 when no session", async () => {
    setSession(null);
    const handler = wrappers.withPlatformAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(401);
    expect(okHandler).not.toHaveBeenCalled();
  });

  it("admits any authenticated role", async () => {
    setSession(UserRole.ATHLETE);
    const handler = wrappers.withPlatformAuth(okHandler);

    const response = await handler(buildRequest(), emptyContext);

    expect(response.status).toBe(204);
  });
});
