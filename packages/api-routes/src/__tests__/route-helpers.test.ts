import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { BadRequestError, NotFoundError } from "@repo/errors";

import type { RouteContext, RouteHandler } from "../types";

vi.mock("../monitoring", () => ({
  getMonitoring: vi.fn(() => undefined),
}));

const {
  parseJsonBody,
  withErrorHandling,
  withPublicRoute,
  createGetHandler,
  createGetByIdHandler,
  createPostHandler,
  createPutHandler,
  createGetByParamHandler,
  createPatchByParamHandler,
  createFormDataPostHandler,
  createDeleteWithBodyHandler,
  createDeleteHandler,
  createToggleHandler,
  createMultiToggleHandler,
} = await import("../route-helpers");

const dummyContext = (params: Record<string, string> = {}): RouteContext => ({
  params: Promise.resolve(params),
});

const buildJsonRequest = (body: unknown): Request =>
  new Request("https://example.com/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("parseJsonBody", () => {
  it("returns the parsed JSON when the body is valid", async () => {
    const request = buildJsonRequest({ name: "alice" });

    const body = await parseJsonBody(request);

    expect(body).toEqual({ name: "alice" });
  });

  it("throws BadRequestError on malformed JSON", async () => {
    const request = new Request("https://example.com/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-valid-json",
    });

    await expect(parseJsonBody(request)).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe("withErrorHandling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("attaches a generated x-request-id header to successful responses", async () => {
    const handler: RouteHandler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(new Request("https://example.com"), dummyContext());

    expect(response.status).toBe(204);
    expect(response.headers.get("x-request-id")).toMatch(/.+/);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("propagates an inbound x-request-id header without rewriting it", async () => {
    const handler: RouteHandler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(
      new Request("https://example.com", { headers: { "x-request-id": "rid-fixed-123" } }),
      dummyContext(),
    );

    expect(response.headers.get("x-request-id")).toBe("rid-fixed-123");
  });

  it("converts AppError throws into the structured error envelope via handleApiError", async () => {
    const handler: RouteHandler = vi.fn(async () => {
      throw new NotFoundError("missing thing");
    });
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(new Request("https://example.com"), dummyContext());
    const json = (await response.json()) as { error: { code: string; message: string } };

    expect(response.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toBe("missing thing");
    expect(response.headers.get("x-request-id")).toMatch(/.+/);
  });

  it("surfaces a bare ZodError from a handler as a 500 server fault", async () => {
    const schema = z.object({ name: z.string() });
    const handler: RouteHandler = vi.fn(async () => {
      schema.parse({ name: 42 });

      return new Response(null, { status: 200 });
    });
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(new Request("https://example.com"), dummyContext());
    const json = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("maps request-body validation failure to a 400 VALIDATION_ERROR with issues", async () => {
    const handler = createPostHandler(
      async (data: { name: string }) => data,
      z.object({ name: z.string() }),
      z.object({ name: z.string() }),
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(buildJsonRequest({ name: 42 }), dummyContext());
    const json = (await response.json()) as { error: { code: string; issues?: unknown } };

    expect(response.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.issues).toBeDefined();
  });

  it("withPublicRoute is a thin alias for withErrorHandling", async () => {
    const handler: RouteHandler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = withPublicRoute(handler);

    const response = await wrapped(new Request("https://example.com"), dummyContext());

    expect(response.status).toBe(204);
    expect(response.headers.get("x-request-id")).toMatch(/.+/);
  });
});

describe("createGetHandler", () => {
  it("invokes apiFn and validates the response with the provided schema", async () => {
    const apiFn = vi.fn(async () => ({ id: "x", name: "alice" }));
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const handler = createGetHandler(apiFn, responseSchema);

    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "x", name: "alice" });
    expect(apiFn).toHaveBeenCalledOnce();
  });

  it("maps a response-schema mismatch to a 500 without leaking issues", async () => {
    const handler = withErrorHandling(
      createGetHandler(async () => ({ name: "x" }), z.object({ name: z.string().min(5) })),
    );

    const response = await handler(new Request("https://example.com"), dummyContext());
    const json = (await response.json()) as {
      error: { code: string; issues?: unknown; details?: unknown };
    };

    expect(response.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(json.error.issues).toBeUndefined();
    expect(json.error.details).toBeUndefined();
  });
});

describe("createGetByIdHandler", () => {
  it("parses params, calls apiFn, and returns the validated body", async () => {
    const apiFn = vi.fn(async (id: string) => ({ id, value: 42 }));
    const paramsSchema = z.object({ id: z.string() });
    const responseSchema = z.object({ id: z.string(), value: z.number() });
    const handler = createGetByIdHandler(apiFn, paramsSchema, responseSchema);

    const response = await handler(new Request("https://example.com"), dummyContext({ id: "abc" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "abc", value: 42 });
    expect(apiFn).toHaveBeenCalledWith("abc");
  });
});

describe("createPostHandler", () => {
  it("returns 201 and the parsed response body when the request is valid", async () => {
    const apiFn = vi.fn(async (data: { name: string }) => ({ id: "new", name: data.name }));
    const requestSchema = z.object({ name: z.string() });
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const handler = createPostHandler(apiFn, requestSchema, responseSchema);

    const response = await handler(buildJsonRequest({ name: "bob" }), dummyContext());
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({ id: "new", name: "bob" });
    expect(apiFn).toHaveBeenCalledWith({ name: "bob" });
  });

  it("throws BadRequestError when the body is not JSON", async () => {
    const apiFn = vi.fn(async () => ({ id: "x", name: "y" }));
    const requestSchema = z.object({ name: z.string() });
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const handler = createPostHandler(apiFn, requestSchema, responseSchema);
    const request = new Request("https://example.com", {
      method: "POST",
      body: "not-json",
    });

    await expect(handler(request, dummyContext())).rejects.toBeInstanceOf(BadRequestError);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createPutHandler", () => {
  it("parses params + body and returns the parsed result", async () => {
    const apiFn = vi.fn(async (id: string, data: { name: string }) => ({ id, name: data.name }));
    const paramsSchema = z.object({ id: z.string() });
    const requestSchema = z.object({ name: z.string() });
    const responseSchema = z.object({ id: z.string(), name: z.string() });
    const handler = createPutHandler(apiFn, paramsSchema, requestSchema, responseSchema);

    const response = await handler(buildJsonRequest({ name: "carol" }), dummyContext({ id: "p1" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "p1", name: "carol" });
    expect(apiFn).toHaveBeenCalledWith("p1", { name: "carol" });
  });
});

describe("createGetByParamHandler", () => {
  it("parses params and returns the validated body", async () => {
    const apiFn = vi.fn(async (params: { slug: string }) => ({ slug: params.slug }));
    const paramsSchema = z.object({ slug: z.string() });
    const responseSchema = z.object({ slug: z.string() });
    const handler = createGetByParamHandler(apiFn, paramsSchema, responseSchema);

    const response = await handler(new Request("https://x"), dummyContext({ slug: "hello" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ slug: "hello" });
  });
});

describe("createPatchByParamHandler", () => {
  it("returns 204 No Content on success", async () => {
    const apiFn = vi.fn(async () => undefined);
    const paramsSchema = z.object({ id: z.string() });
    const requestSchema = z.object({ name: z.string() });
    const handler = createPatchByParamHandler(apiFn, paramsSchema, requestSchema);

    const response = await handler(buildJsonRequest({ name: "x" }), dummyContext({ id: "5" }));

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
    expect(apiFn).toHaveBeenCalledWith({ id: "5" }, { name: "x" });
  });
});

describe("createFormDataPostHandler", () => {
  it("returns 201 with the validated body when the apiFn succeeds", async () => {
    const apiFn = vi.fn(async (form: FormData) => ({ filename: form.get("name") }));
    const responseSchema = z.object({ filename: z.string() });
    const handler = createFormDataPostHandler(apiFn, responseSchema);

    const formData = new FormData();

    formData.append("name", "doc.pdf");

    const request = new Request("https://example.com/upload", { method: "POST", body: formData });
    const response = await handler(request, dummyContext());
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({ filename: "doc.pdf" });
  });
});

describe("createDeleteWithBodyHandler", () => {
  it("returns 204 and forwards the parsed body to apiFn", async () => {
    const apiFn = vi.fn(async () => undefined);
    const requestSchema = z.object({ ids: z.array(z.string()) });
    const handler = createDeleteWithBodyHandler(apiFn, requestSchema);

    const response = await handler(buildJsonRequest({ ids: ["a", "b"] }), dummyContext());

    expect(response.status).toBe(204);
    expect(apiFn).toHaveBeenCalledWith({ ids: ["a", "b"] });
  });
});

describe("createDeleteHandler", () => {
  it("returns 204 and forwards the id to apiFn", async () => {
    const apiFn = vi.fn(async () => undefined);
    const paramsSchema = z.object({ id: z.string() });
    const handler = createDeleteHandler(apiFn, paramsSchema);

    const response = await handler(new Request("https://x"), dummyContext({ id: "to-delete" }));

    expect(response.status).toBe(204);
    expect(apiFn).toHaveBeenCalledWith("to-delete");
  });
});

describe("createToggleHandler", () => {
  it("returns the validated body produced by apiFn", async () => {
    const apiFn = vi.fn(async (id: string) => ({ id, isActive: true }));
    const paramsSchema = z.object({ id: z.string() });
    const responseSchema = z.object({ id: z.string(), isActive: z.boolean() });
    const handler = createToggleHandler(apiFn, paramsSchema, responseSchema);

    const response = await handler(new Request("https://x"), dummyContext({ id: "9" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "9", isActive: true });
    expect(apiFn).toHaveBeenCalledWith("9");
  });
});

describe("createMultiToggleHandler", () => {
  it("dispatches to the handler matching the field query parameter", async () => {
    const promote = vi.fn(async (id: string) => ({ id, isPromoted: true, isDemoted: false }));
    const demote = vi.fn(async (id: string) => ({ id, isPromoted: false, isDemoted: true }));
    const handlers = { promote, demote } as const;
    const paramsSchema = z.object({ id: z.string() });
    const querySchema = z.object({ field: z.enum(["promote", "demote"]) });
    const responseSchema = z.object({
      id: z.string(),
      isPromoted: z.boolean(),
      isDemoted: z.boolean(),
    });
    const handler = createMultiToggleHandler(handlers, paramsSchema, querySchema, responseSchema);

    const request = new Request("https://example.com/api/items/9/toggle?field=promote");
    const response = await handler(request, dummyContext({ id: "9" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isPromoted).toBe(true);
    expect(promote).toHaveBeenCalledWith("9");
    expect(demote).not.toHaveBeenCalled();
  });
});
