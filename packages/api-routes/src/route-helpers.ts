import { NextResponse } from "next/server";
import { type ZodError, type ZodType, type ZodTypeDef } from "zod";

import { BadRequestError, InternalServerError, ValidationError } from "@repo/errors";

import { handleApiError } from "./error-handler";
import { wrapHandler } from "./idempotency";
import type { IdempotencyConfig } from "./idempotency";
import { runWithContext } from "./request-context";
import { type RouteContext, type RouteHandler } from "./types";

type ParseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export const parseJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON in request body");
  }
};

const toIssues = (error: ZodError): Array<{ path: string; message: string; code: string }> =>
  error.errors.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

export const parseRequest = <T>(schema: ParseSchema<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ValidationError("Validation failed", { issues: toIssues(result.error) });
  }

  return result.data;
};

export const parseResponse = <T>(schema: ParseSchema<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new InternalServerError("Response validation failed", { issues: toIssues(result.error) });
  }

  return result.data;
};

export const withErrorHandling =
  (fn: RouteHandler): RouteHandler =>
  async (request, context) => {
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

    return runWithContext({ requestId }, async () => {
      try {
        const response = await fn(request, context);

        response.headers.set("x-request-id", requestId);

        return response;
      } catch (error) {
        return handleApiError(error, requestId);
      }
    });
  };

export const withPublicRoute = (handler: RouteHandler): RouteHandler => withErrorHandling(handler);

export const createGetHandler = <TResponse>(
  apiFn: () => Promise<TResponse>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async () => {
    const data = await apiFn();
    const validated = parseResponse(responseSchema, data);

    return NextResponse.json(validated);
  };
};

export const createGetByIdHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = parseRequest(paramsSchema, await context.params);
    const data = await apiFn(id);
    const validated = parseResponse(responseSchema, data);

    return NextResponse.json(validated);
  };
};

const JSON_CONFIG: IdempotencyConfig = { bodyMode: "json" };
const NONE_CONFIG: IdempotencyConfig = { bodyMode: "none" };
const FORMDATA_CONFIG: IdempotencyConfig = { bodyMode: "formdata" };

export const createPostHandler = <TRequest, TResponse>(
  apiFn: (data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): RouteHandler => {
  const inner: RouteHandler = async (request) => {
    const body = await parseJsonBody(request);
    const data = parseRequest(requestSchema, body);
    const result = await apiFn(data);
    const validated = parseResponse(responseSchema, result);

    return NextResponse.json(validated, { status: 201 });
  };

  return wrapHandler(inner, JSON_CONFIG);
};

export const createPutHandler = <TRequest, TResponse>(
  apiFn: (id: string, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): RouteHandler => {
  const inner: RouteHandler = async (request, context) => {
    const { id } = parseRequest(paramsSchema, await context.params);
    const body = await parseJsonBody(request);
    const data = parseRequest(requestSchema, body);
    const result = await apiFn(id, data);
    const validated = parseResponse(responseSchema, result);

    return NextResponse.json(validated);
  };

  return wrapHandler(inner, JSON_CONFIG);
};

export const createGetByParamHandler = <TParams, TResponse>(
  apiFn: (params: TParams) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const params = parseRequest(paramsSchema, await context.params);
    const data = await apiFn(params);
    const validated = parseResponse(responseSchema, data);

    return NextResponse.json(validated);
  };
};

export const createPatchByParamHandler = <TParams, TRequest>(
  apiFn: (params: TParams, data: TRequest) => Promise<void>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
): RouteHandler => {
  const inner: RouteHandler = async (request, context) => {
    const params = parseRequest(paramsSchema, await context.params);
    const body = await parseJsonBody(request);
    const data = parseRequest(requestSchema, body);

    await apiFn(params, data);

    return new NextResponse(null, { status: 204 });
  };

  return wrapHandler(inner, JSON_CONFIG);
};

export const createFormDataPostHandler = <TResponse>(
  apiFn: (formData: FormData) => Promise<TResponse>,
  responseSchema: ParseSchema<TResponse>,
): RouteHandler => {
  const inner: RouteHandler = async (request) => {
    const formData = await request.formData();
    const result = await apiFn(formData);
    const validated = parseResponse(responseSchema, result);

    return NextResponse.json(validated, { status: 201 });
  };

  return wrapHandler(inner, FORMDATA_CONFIG);
};

export const createDeleteWithBodyHandler = <TRequest>(
  apiFn: (data: TRequest) => Promise<void>,
  requestSchema: ParseSchema<TRequest>,
): RouteHandler => {
  const inner: RouteHandler = async (request) => {
    const body = await parseJsonBody(request);
    const data = parseRequest(requestSchema, body);

    await apiFn(data);

    return new NextResponse(null, { status: 204 });
  };

  return wrapHandler(inner, JSON_CONFIG);
};

export const createDeleteHandler = (
  apiFn: (id: string) => Promise<void>,
  paramsSchema: ParseSchema<{ id: string }>,
): RouteHandler => {
  const inner: RouteHandler = async (_request, context) => {
    const { id } = parseRequest(paramsSchema, await context.params);

    await apiFn(id);

    return new NextResponse(null, { status: 204 });
  };

  return wrapHandler(inner, NONE_CONFIG);
};

export const createToggleHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  responseSchema: ParseSchema<TResponse>,
): RouteHandler => {
  const inner: RouteHandler = async (_request, context) => {
    const { id } = parseRequest(paramsSchema, await context.params);
    const result = await apiFn(id);
    const validated = parseResponse(responseSchema, result);

    return NextResponse.json(validated);
  };

  return wrapHandler(inner, NONE_CONFIG);
};

export const createMultiToggleHandler = <TField extends string, TResponse>(
  handlers: Record<TField, (id: string) => Promise<TResponse>>,
  paramsSchema: ParseSchema<{ id: string }>,
  querySchema: ParseSchema<{ field: TField }>,
  responseSchema: ParseSchema<TResponse>,
): RouteHandler => {
  const inner: RouteHandler = async (request, context) => {
    const { id } = parseRequest(paramsSchema, await context.params);
    const { field } = parseRequest(querySchema, {
      field: new URL(request.url).searchParams.get("field"),
    });
    const result = await handlers[field](id);
    const validated = parseResponse(responseSchema, result);

    return NextResponse.json(validated);
  };

  return wrapHandler(inner, NONE_CONFIG);
};
