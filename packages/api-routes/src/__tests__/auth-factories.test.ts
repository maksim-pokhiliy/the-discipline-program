import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { AuthenticatedHandler, RouteContext, RouteHandler } from "../types";

vi.mock("../monitoring", () => ({
  getMonitoring: vi.fn(() => undefined),
}));

const { withErrorHandling } = await import("../route-helpers");
const {
  createAuthActionHandler,
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthGetByParamWithQueryHandler,
  createAuthGetHandler,
  createAuthGetWithQueryHandler,
  createAuthPostByParamHandler,
  createAuthPostHandler,
  createAuthPutByParamHandler,
  createAuthPutHandler,
  createAuthVoidPutByParamHandler,
} = await import("../auth-factories");

const USER_ID = "user-1";
const VALID_ID = "cm2x8k0q50000abcdefghijkl";
const MALFORMED_ID = "not a cuid";
const ITEMS_URL = "https://example.com/api/items";
const VALID_QUERY = "?page=2";
const MALFORMED_QUERY = "?page=zero";
const VALID_BODY = { name: "Back squat" };
const MALFORMED_BODY = { name: 42 };
const OK_RESULT = { ok: true } as const;
const FAILING_RESULT = { ok: false };

const paramsSchema = z.object({ id: z.string().cuid() });
const querySchema = z.object({ page: z.coerce.number().int().positive() });
const requestSchema = z.object({ name: z.string().min(1) });
const responseSchema = z.object({ ok: z.literal(true) });
const errorEnvelopeSchema = z.object({ error: z.object({ code: z.string() }) });

const VALIDATION_FAILURE = { status: 400, code: "VALIDATION_ERROR" };
const SERVER_FAULT = { status: 500, code: "INTERNAL_SERVER_ERROR" };

const asRoute = (handler: AuthenticatedHandler): RouteHandler =>
  withErrorHandling((request, context) => handler(request, context, USER_ID));

const emptyContext = (): RouteContext => ({ params: Promise.resolve({}) });

const contextWith = (id: string): RouteContext => ({ params: Promise.resolve({ id }) });

const getRequest = (query = ""): Request => new Request(`${ITEMS_URL}${query}`);

const bodylessRequest = (method: string): Request => new Request(ITEMS_URL, { method });

const jsonRequest = (method: string, body: unknown): Request =>
  new Request(ITEMS_URL, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const failureOf = async (response: Response): Promise<{ status: number; code: string }> => {
  const { error } = errorEnvelopeSchema.parse(await response.json());

  return { status: response.status, code: error.code };
};

const okApiFn = () => vi.fn(async () => OK_RESULT);

const buildFixture = <TResult extends object | undefined>(
  result: TResult,
  createHandler: (apiFn: () => Promise<TResult>) => AuthenticatedHandler,
) => {
  const apiFn = vi.fn(async () => result);

  return { apiFn, route: asRoute(createHandler(apiFn)) };
};

describe("createAuthGetHandler", () => {
  it("keeps a result that fails the response schema a 500", async () => {
    const apiFn = vi.fn(async () => FAILING_RESULT);
    const route = asRoute(createAuthGetHandler(apiFn, responseSchema));

    expect(await failureOf(await route(getRequest(), emptyContext()))).toStrictEqual(SERVER_FAULT);
    expect(apiFn).toHaveBeenCalledWith(USER_ID);
  });
});

describe("createAuthGetWithQueryHandler", () => {
  const build = () =>
    buildFixture(OK_RESULT, (apiFn) =>
      createAuthGetWithQueryHandler(apiFn, querySchema, responseSchema),
    );

  it("passes the parsed query and the user id to the api function", async () => {
    const { apiFn, route } = build();

    expect((await route(getRequest(VALID_QUERY), emptyContext())).status).toBe(200);
    expect(apiFn).toHaveBeenCalledWith(USER_ID, { page: 2 });
  });

  it("answers 400 VALIDATION_ERROR for a malformed query and never calls the api function", async () => {
    const { apiFn, route } = build();

    expect(await failureOf(await route(getRequest(MALFORMED_QUERY), emptyContext()))).toStrictEqual(
      VALIDATION_FAILURE,
    );
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthGetByParamHandler", () => {
  it("answers 400 VALIDATION_ERROR for a malformed param and never calls the api function", async () => {
    const apiFn = okApiFn();
    const route = asRoute(createAuthGetByParamHandler(apiFn, paramsSchema, responseSchema));

    expect(await failureOf(await route(getRequest(), contextWith(MALFORMED_ID)))).toStrictEqual(
      VALIDATION_FAILURE,
    );
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("keeps a result that fails the response schema a 500", async () => {
    const apiFn = vi.fn(async () => FAILING_RESULT);
    const route = asRoute(createAuthGetByParamHandler(apiFn, paramsSchema, responseSchema));

    expect(await failureOf(await route(getRequest(), contextWith(VALID_ID)))).toStrictEqual(
      SERVER_FAULT,
    );
    expect(apiFn).toHaveBeenCalledWith(USER_ID, { id: VALID_ID });
  });
});

describe("createAuthGetByParamWithQueryHandler", () => {
  const build = () =>
    buildFixture(OK_RESULT, (apiFn) =>
      createAuthGetByParamWithQueryHandler(apiFn, paramsSchema, querySchema, responseSchema),
    );

  it("answers 400 VALIDATION_ERROR for a malformed param", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(getRequest(VALID_QUERY), contextWith(MALFORMED_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("answers 400 VALIDATION_ERROR for a malformed query", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(getRequest(MALFORMED_QUERY), contextWith(VALID_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthPostHandler", () => {
  const build = () =>
    buildFixture(OK_RESULT, (apiFn) => createAuthPostHandler(apiFn, requestSchema, responseSchema));

  it("answers 201 and passes the parsed body to the api function", async () => {
    const { apiFn, route } = build();

    expect((await route(jsonRequest("POST", VALID_BODY), emptyContext())).status).toBe(201);
    expect(apiFn).toHaveBeenCalledWith(USER_ID, VALID_BODY);
  });

  it("answers 400 VALIDATION_ERROR for a malformed body", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("POST", MALFORMED_BODY), emptyContext())),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthPostByParamHandler", () => {
  const build = () =>
    buildFixture(OK_RESULT, (apiFn) =>
      createAuthPostByParamHandler(apiFn, paramsSchema, requestSchema, responseSchema),
    );

  it("answers 400 VALIDATION_ERROR for a malformed param", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("POST", VALID_BODY), contextWith(MALFORMED_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("answers 400 VALIDATION_ERROR for a malformed body", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("POST", MALFORMED_BODY), contextWith(VALID_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthPutHandler", () => {
  it("answers 400 VALIDATION_ERROR for a malformed body", async () => {
    const apiFn = okApiFn();
    const route = asRoute(createAuthPutHandler(apiFn, requestSchema, responseSchema));

    expect(
      await failureOf(await route(jsonRequest("PUT", MALFORMED_BODY), emptyContext())),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthPutByParamHandler", () => {
  const build = () =>
    buildFixture(OK_RESULT, (apiFn) =>
      createAuthPutByParamHandler(apiFn, paramsSchema, requestSchema, responseSchema),
    );

  it("answers 400 VALIDATION_ERROR for a malformed param", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("PUT", VALID_BODY), contextWith(MALFORMED_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("answers 400 VALIDATION_ERROR for a malformed body", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("PUT", MALFORMED_BODY), contextWith(VALID_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthVoidPutByParamHandler", () => {
  const build = () =>
    buildFixture(undefined, (apiFn) =>
      createAuthVoidPutByParamHandler(apiFn, paramsSchema, requestSchema),
    );

  it("answers 400 VALIDATION_ERROR for a malformed param", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("PUT", VALID_BODY), contextWith(MALFORMED_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });

  it("answers 400 VALIDATION_ERROR for a malformed body", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(jsonRequest("PUT", MALFORMED_BODY), contextWith(VALID_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthDeleteHandler", () => {
  const build = () =>
    buildFixture(undefined, (apiFn) => createAuthDeleteHandler(apiFn, paramsSchema));

  it("answers 204 and passes the parsed params to the api function", async () => {
    const { apiFn, route } = build();

    expect((await route(bodylessRequest("DELETE"), contextWith(VALID_ID))).status).toBe(204);
    expect(apiFn).toHaveBeenCalledWith(USER_ID, { id: VALID_ID });
  });

  it("answers 400 VALIDATION_ERROR for a malformed param and never calls the api function", async () => {
    const { apiFn, route } = build();

    expect(
      await failureOf(await route(bodylessRequest("DELETE"), contextWith(MALFORMED_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});

describe("createAuthActionHandler", () => {
  it("answers 400 VALIDATION_ERROR for a malformed param", async () => {
    const apiFn = okApiFn();
    const route = asRoute(createAuthActionHandler(apiFn, paramsSchema, responseSchema));

    expect(
      await failureOf(await route(bodylessRequest("POST"), contextWith(MALFORMED_ID))),
    ).toStrictEqual(VALIDATION_FAILURE);
    expect(apiFn).not.toHaveBeenCalled();
  });
});
