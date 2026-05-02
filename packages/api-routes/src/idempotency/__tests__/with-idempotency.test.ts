import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ConflictError } from "@repo/errors";

import type { AuthenticatedHandler, RouteContext, RouteHandler } from "../../types";

const lookupMock = vi.fn();
const persistMock = vi.fn();
const getStoreMock = vi.fn();
const captureExceptionMock = vi.fn();

vi.mock("../idempotency-store-registry", () => ({
  getIdempotencyStore: () => getStoreMock(),
  setIdempotencyStore: vi.fn(),
}));

vi.mock("../../monitoring", () => ({
  getMonitoring: () => ({
    captureException: captureExceptionMock,
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    setContext: vi.fn(),
    flush: vi.fn(async () => true),
  }),
  setMonitoring: vi.fn(),
}));

const { wrapAuthHandler, wrapHandler } = await import("../with-idempotency");
const { sha256Hex } = await import("../request-fingerprint");

const KEY = "abc-12345";
const KEY_HASH = sha256Hex(KEY).slice(0, 12);

const dummyContext = (params: Record<string, string> = {}): RouteContext => ({
  params: Promise.resolve(params),
});

const buildJsonRequest = (
  body: unknown,
  init: { headers?: Record<string, string>; url?: string; method?: string } = {},
): Request =>
  new Request(init.url ?? "https://example.com/api/resource", {
    method: init.method ?? "POST",
    headers: { "content-type": "application/json", ...init.headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const buildEmptyRequest = (
  init: { headers?: Record<string, string>; url?: string; method?: string } = {},
): Request =>
  new Request(init.url ?? "https://example.com/api/resource", {
    method: init.method ?? "DELETE",
    headers: init.headers ?? {},
  });

const installStore = (
  overrides: Partial<{ lookup: typeof lookupMock; persist: typeof persistMock }> = {},
): void => {
  getStoreMock.mockReturnValue({
    lookup: overrides.lookup ?? lookupMock,
    persist: overrides.persist ?? persistMock,
  });
};

beforeEach(() => {
  lookupMock.mockReset();
  persistMock.mockReset();
  getStoreMock.mockReset();
  captureExceptionMock.mockReset();
});

describe("MT-1: multi-value Idempotency-Key — first value wins (post-QA-001)", () => {
  it("MT-1 — splits a comma-joined header value and validates only the first entry", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async () => new Response("{}", { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const request = new Request("https://example.com/api/x", {
      method: "POST",
      headers: [
        ["Idempotency-Key", "abc"],
        ["Idempotency-Key", "xyz"],
        ["content-type", "application/json"],
      ],
      body: "{}",
    });
    const response = await wrapped(request, dummyContext());

    expect(response.status).toBe(201);
    expect(lookupMock).toHaveBeenCalledTimes(1);
    expect(lookupMock.mock.calls[0]?.[0]).toMatchObject({ key: "abc" });
    expect(persistMock).toHaveBeenCalledTimes(1);
    expect(persistMock.mock.calls[0]?.[0]).toMatchObject({ key: "abc" });
  });
});

describe("MT-4: non-JSON live response with bodyMode json — current contract", () => {
  it("MT-4 / QA-003 — JSON.parse on a plaintext response throws inside cloneResponseForCache (post-fix QA-003 will change this)", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });

    const inner: RouteHandler = vi.fn(async () => new Response("plaintext", { status: 200 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    await expect(
      wrapped(
        buildJsonRequest({ ping: 1 }, { headers: { "Idempotency-Key": KEY } }),
        dummyContext(),
      ),
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe("MT-5: concurrent miss — race resolved via persist returning raced", () => {
  it("MT-5 / QA-005 — second client sees the raced winner's cached response with Idempotency-Replayed: true", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });

    const winnerCached = {
      status: 201,
      body: { id: "winner" },
      headers: { "content-type": "application/json" },
      createdAt: new Date("2026-05-01T00:00:00Z"),
    };

    persistMock
      .mockResolvedValueOnce({ status: "persisted" })
      .mockResolvedValueOnce({ status: "raced", cached: winnerCached });

    const innerA: RouteHandler = vi.fn(
      async () => new Response('{"id":"local-a"}', { status: 201 }),
    );
    const innerB: RouteHandler = vi.fn(
      async () => new Response('{"id":"local-b"}', { status: 201 }),
    );
    const wrappedA = wrapHandler(innerA, { method: "POST", bodyMode: "json" });
    const wrappedB = wrapHandler(innerB, { method: "POST", bodyMode: "json" });

    const responseA = await wrappedA(
      buildJsonRequest({ x: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );
    const responseB = await wrappedB(
      buildJsonRequest({ x: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(innerA).toHaveBeenCalledOnce();
    expect(innerB).toHaveBeenCalledOnce();
    expect(responseA.headers.get("Idempotency-Replayed")).toBe("false");
    expect(responseB.headers.get("Idempotency-Replayed")).toBe("true");
    expect(responseB.headers.get("Idempotency-Key-Created-At")).toBe(
      winnerCached.createdAt.toISOString(),
    );
    expect(await responseB.json()).toEqual({ id: "winner" });
  });
});

describe("MT-6: persist race + raced row has different fingerprint (REL-003 hardening, future)", () => {
  it.todo(
    'MT-6 / QA-007 — persist returning {status:"persisted"} on different-fingerprint race silently swallows the mismatch; harden by throwing ConflictError',
  );
});

describe("MT-7: throw inside inner does not call persist", () => {
  it("MT-7 / REVIEW-002 / QA-014 — when inner throws AppError the wrapper does not call persist and bubbles the throw out for withErrorHandling", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });

    const inner: RouteHandler = vi.fn(async () => {
      throw new BadRequestError("validation failed");
    });
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    await expect(
      wrapped(buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }), dummyContext()),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe("MT-8: empty Idempotency-Key value treated as absent", () => {
  it("MT-8 / QA-022 — header present but empty falls through to handler with no store interaction and no Idempotency-Replayed header", async () => {
    installStore();

    const inner: RouteHandler = vi.fn(async () => new Response('{"ok":1}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": "" } }),
      dummyContext(),
    );

    expect(response.status).toBe(201);
    expect(response.headers.has("Idempotency-Replayed")).toBe(false);
    expect(lookupMock).not.toHaveBeenCalled();
    expect(persistMock).not.toHaveBeenCalled();
    expect(inner).toHaveBeenCalledOnce();
  });
});

describe("MT-9: 257-char key rejected with BadRequestError carrying details.length", () => {
  it("MT-9 / QA-023 — over-length key fails the length check before regex with details.length 257", async () => {
    installStore();

    const inner: RouteHandler = vi.fn(async () => new Response("{}", { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const overLength = "a".repeat(257);

    let captured: unknown;

    try {
      await wrapped(
        buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": overLength } }),
        dummyContext(),
      );
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(BadRequestError);

    if (!(captured instanceof BadRequestError)) {
      throw captured;
    }

    expect(captured.statusCode).toBe(400);
    expect(captured.details?.length).toBe(257);
    expect(typeof captured.details?.keyHash).toBe("string");
    expect(inner).not.toHaveBeenCalled();
  });
});

describe("MT-10: Set-Cookie excluded from replay", () => {
  it("MT-10 / QA-010 — cloneResponseForCache strips multi-value Set-Cookie before persisting so replays cannot leak session cookies", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async () => {
      const headers = new Headers({ "content-type": "application/json" });

      headers.append("set-cookie", "a=1; HttpOnly");
      headers.append("set-cookie", "b=2; HttpOnly");

      return new Response('{"ok":1}', { status: 201, headers });
    });
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    const persistCall = persistMock.mock.calls[0]?.[0] as
      | { response: { headers: Record<string, string> } }
      | undefined;

    expect(persistCall).toBeDefined();
    expect(persistCall?.response.headers["set-cookie"]).toBeUndefined();
    expect(persistCall?.response.headers["Set-Cookie"]).toBeUndefined();
  });

  it("MT-10 / QA-010 — replay path produces a Response with no Set-Cookie when the cached headers excluded it", async () => {
    installStore();
    lookupMock.mockResolvedValue({
      kind: "replay",
      cached: {
        status: 200,
        body: { ok: 1 },
        headers: { "content-type": "application/json" },
        createdAt: new Date("2026-05-01T00:00:00Z"),
      },
    });

    const inner: RouteHandler = vi.fn(async () => new Response("{}", { status: 200 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(response.headers.get("Idempotency-Replayed")).toBe("true");
  });
});

describe("MT-11: cross-tenant scoping prevents replay across user identities", () => {
  it("MT-11 / QA-011 — wrapAuthHandler passes user:<userId> as scope so a row stored under user:A is not surfaced for user:B", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: AuthenticatedHandler = vi.fn(
      async () => new Response('{"ok":1}', { status: 201 }),
    );
    const wrapped = wrapAuthHandler(inner, { method: "POST", bodyMode: "json" });

    await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
      "B",
    );

    expect(lookupMock).toHaveBeenCalledOnce();
    expect(lookupMock.mock.calls[0]?.[0]).toMatchObject({ scope: "user:B" });
    expect(persistMock).toHaveBeenCalledOnce();
    expect(persistMock.mock.calls[0]?.[0]).toMatchObject({ scope: "user:B" });
  });
});

describe("MT-12: formdata bodyMode rebuilds the request so inner.formData() parses", () => {
  it("MT-12 / REVIEW-001 — inner can call request.formData() on the rebuilt request without a boundary mismatch", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async (request) => {
      const form = await request.formData();
      const file = form.get("file");
      const note = form.get("note");

      const filename = file instanceof File ? file.name : "";
      const noteText = typeof note === "string" ? note : "";

      return new Response(JSON.stringify({ filename, noteText }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    });
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "formdata" });

    const form = new FormData();

    form.append(
      "file",
      new File([new Uint8Array([1, 2, 3, 4])], "doc.bin", { type: "application/octet-stream" }),
    );
    form.append("note", "hello");

    const request = new Request("https://example.com/api/upload", {
      method: "POST",
      headers: { "Idempotency-Key": KEY },
      body: form,
    });
    const response = await wrapped(request, dummyContext());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ filename: "doc.bin", noteText: "hello" });
    expect(inner).toHaveBeenCalledOnce();
  });
});

describe("MT-13: JSON rebuild preserves Authorization header and the original body", () => {
  it("MT-13 / QA-017 — inner sees Authorization header and reads the same body via request.json()", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    let observedAuth: string | null = null;
    let observedBody: unknown = undefined;
    const inner: RouteHandler = vi.fn(async (request) => {
      observedAuth = request.headers.get("authorization");
      observedBody = await request.json();

      return new Response('{"ok":1}', { status: 201 });
    });
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    await wrapped(
      buildJsonRequest(
        { name: "alice" },
        { headers: { "Idempotency-Key": KEY, authorization: "Bearer xyz" } },
      ),
      dummyContext(),
    );

    expect(observedAuth).toBe("Bearer xyz");
    expect(observedBody).toEqual({ name: "alice" });
  });
});

describe("MT-14: same key + same body + different scope produce independent persists", () => {
  it("MT-14 — wrapAuthHandler persists under the per-user scope so two userIds populate distinct rows", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: AuthenticatedHandler = vi.fn(
      async () => new Response('{"ok":1}', { status: 201 }),
    );
    const wrapped = wrapAuthHandler(inner, { method: "POST", bodyMode: "json" });

    await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
      "userA",
    );
    await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
      "userB",
    );

    expect(persistMock).toHaveBeenCalledTimes(2);
    const scopes = persistMock.mock.calls.map((call) => {
      const arg = call[0] as { scope: string };

      return arg.scope;
    });

    expect(scopes).toEqual(["user:userA", "user:userB"]);
    const fingerprints = persistMock.mock.calls.map((call) => {
      const arg = call[0] as { requestFingerprint: string };

      return arg.requestFingerprint;
    });

    expect(fingerprints[0]).toBe(fingerprints[1]);
  });
});

describe("MT-15: lookup throw falls open and reports to monitoring", () => {
  it("MT-15 — lookup error captured to monitoring with idempotency-store tag, handler still runs, response annotated as live", async () => {
    installStore();
    lookupMock.mockRejectedValue(new Error("conn refused"));
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async () => new Response('{"ok":1}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(inner).toHaveBeenCalledOnce();
    expect(response.headers.get("Idempotency-Replayed")).toBe("false");
    expect(captureExceptionMock).toHaveBeenCalledOnce();
    const captureArgs = captureExceptionMock.mock.calls[0];

    expect(captureArgs?.[0]).toBeInstanceOf(Error);
    expect(captureArgs?.[1]).toMatchObject({
      tags: { component: "idempotency-store" },
      level: "warning",
    });
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe("MT-16: whitespace-padded Idempotency-Key is trimmed by the runtime then validated", () => {
  it("MT-16 / QA-018 — the wrapper sees the runtime-trimmed value and accepts it", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async () => new Response('{"ok":1}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const request = new Request("https://example.com/api/x", {
      method: "POST",
      headers: { "Idempotency-Key": "  abc  ", "content-type": "application/json" },
      body: "{}",
    });

    expect(request.headers.get("Idempotency-Key")).toBe("abc");

    await wrapped(request, dummyContext());

    expect(lookupMock).toHaveBeenCalledOnce();
    expect(lookupMock.mock.calls[0]?.[0]).toMatchObject({ key: "abc" });
  });
});

describe("MT-17: replay of a 204 returns a body-less Response", () => {
  it("MT-17 — cached 204 short-circuits to a Response with status 204 and null body", async () => {
    installStore();
    lookupMock.mockResolvedValue({
      kind: "replay",
      cached: {
        status: 204,
        body: null,
        headers: {},
        createdAt: new Date("2026-05-01T00:00:00Z"),
      },
    });

    const inner: RouteHandler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = wrapHandler(inner, { method: "DELETE", bodyMode: "none" });

    const response = await wrapped(
      buildEmptyRequest({ headers: { "Idempotency-Key": KEY }, method: "DELETE" }),
      dummyContext(),
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(response.headers.get("Idempotency-Replayed")).toBe("true");
    expect(inner).not.toHaveBeenCalled();
  });
});

describe("MT-18: replay of a 200 hard-codes content-type application/json", () => {
  it("MT-18 — cached text/plain content-type is overridden to application/json on replay", async () => {
    installStore();
    lookupMock.mockResolvedValue({
      kind: "replay",
      cached: {
        status: 200,
        body: { hello: "world" },
        headers: { "content-type": "text/plain" },
        createdAt: new Date("2026-05-01T00:00:00Z"),
      },
    });

    const inner: RouteHandler = vi.fn(async () => new Response('{"x":1}', { status: 200 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ hello: "world" });
  });
});

describe("MT-19: replay does not re-run the handler", () => {
  it('MT-19 — when lookup returns kind:"replay", the inner spy is never invoked', async () => {
    installStore();
    lookupMock.mockResolvedValue({
      kind: "replay",
      cached: {
        status: 201,
        body: { id: "cached" },
        headers: { "content-type": "application/json" },
        createdAt: new Date("2026-05-01T00:00:00Z"),
      },
    });

    const inner: RouteHandler = vi.fn(async () => new Response('{"id":"local"}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(inner).not.toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "cached" });
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe('MT-20: empty body fingerprint is sha256("")', () => {
  it('MT-20 — bodyMode none produces sha256("") as the request fingerprint passed to lookup/persist', async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = wrapHandler(inner, { method: "DELETE", bodyMode: "none" });

    await wrapped(
      buildEmptyRequest({ headers: { "Idempotency-Key": KEY }, method: "DELETE" }),
      dummyContext(),
    );

    const expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    expect(lookupMock.mock.calls[0]?.[0]).toMatchObject({ requestFingerprint: expected });
    expect(persistMock.mock.calls[0]?.[0]).toMatchObject({ requestFingerprint: expected });
  });

  it("MT-20 — two bodyless requests with the same key + scope produce identical fingerprints", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockResolvedValue({ status: "persisted" });

    const inner: RouteHandler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = wrapHandler(inner, { method: "DELETE", bodyMode: "none" });

    await wrapped(
      buildEmptyRequest({ headers: { "Idempotency-Key": KEY }, method: "DELETE" }),
      dummyContext(),
    );
    await wrapped(
      buildEmptyRequest({ headers: { "Idempotency-Key": KEY }, method: "DELETE" }),
      dummyContext(),
    );

    const fpA = (lookupMock.mock.calls[0]?.[0] as { requestFingerprint: string })
      .requestFingerprint;
    const fpB = (lookupMock.mock.calls[1]?.[0] as { requestFingerprint: string })
      .requestFingerprint;

    expect(fpA).toBe(fpB);
  });
});

describe("Mismatch path locks down ConflictError contract", () => {
  it('lookup returning kind:"mismatch" throws ConflictError with redacted keyHash details', async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "mismatch" });

    const inner: RouteHandler = vi.fn(async () => new Response('{"x":1}', { status: 200 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    let captured: unknown;

    try {
      await wrapped(
        buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
        dummyContext(),
      );
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(ConflictError);

    if (!(captured instanceof ConflictError)) {
      throw captured;
    }

    expect(captured.statusCode).toBe(409);
    expect(captured.message).toBe("Idempotency-Key reuse with different request body");
    expect(captured.details?.keyHash).toBe(KEY_HASH);
    expect(inner).not.toHaveBeenCalled();
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe("Store registry unset falls open", () => {
  it("getIdempotencyStore returning undefined runs the handler with Idempotency-Replayed: false", async () => {
    getStoreMock.mockReturnValue(undefined);

    const inner: RouteHandler = vi.fn(async () => new Response('{"ok":1}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(inner).toHaveBeenCalledOnce();
    expect(response.headers.get("Idempotency-Replayed")).toBe("false");
    expect(lookupMock).not.toHaveBeenCalled();
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe("Persist failure is captured and live response returned", () => {
  it("non-P2002 persist throw is captured to monitoring and the live response is still returned", async () => {
    installStore();
    lookupMock.mockResolvedValue({ kind: "miss" });
    persistMock.mockRejectedValue(new Error("pool exhausted"));

    const inner: RouteHandler = vi.fn(async () => new Response('{"ok":1}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(
      buildJsonRequest({ a: 1 }, { headers: { "Idempotency-Key": KEY } }),
      dummyContext(),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Idempotency-Replayed")).toBe("false");
    expect(captureExceptionMock).toHaveBeenCalledOnce();
    expect(captureExceptionMock.mock.calls[0]?.[1]).toMatchObject({
      tags: { component: "idempotency-store" },
      level: "warning",
    });
  });
});

describe("No Idempotency-Key header runs the handler with no Idempotency-Replayed annotation", () => {
  it("absent header does not invoke the store and leaves Idempotency-Replayed unset", async () => {
    installStore();

    const inner: RouteHandler = vi.fn(async () => new Response('{"ok":1}', { status: 201 }));
    const wrapped = wrapHandler(inner, { method: "POST", bodyMode: "json" });

    const response = await wrapped(buildJsonRequest({ a: 1 }), dummyContext());

    expect(inner).toHaveBeenCalledOnce();
    expect(lookupMock).not.toHaveBeenCalled();
    expect(persistMock).not.toHaveBeenCalled();
    expect(response.headers.has("Idempotency-Replayed")).toBe(false);
  });
});
