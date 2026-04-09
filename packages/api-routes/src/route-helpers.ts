import { NextResponse } from "next/server";
import { type ZodType, type ZodTypeDef } from "zod";

import { handleApiError } from "./error-handler";
import { type RouteContext, type RouteHandler } from "./types";

type ParseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export const withErrorHandling =
  <TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<Response>) =>
  async (...args: TArgs): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };

export const withPublicRoute = (handler: RouteHandler): RouteHandler => withErrorHandling(handler);

export const createGetHandler = <TResponse>(
  apiFn: () => Promise<TResponse>,
  responseSchema?: ParseSchema<TResponse>,
) => {
  return async () => {
    const data = await apiFn();
    const validated = responseSchema ? responseSchema.parse(data) : data;

    return NextResponse.json(validated);
  };
};

export const createGetByIdHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  responseSchema?: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const data = await apiFn(id);
    const validated = responseSchema ? responseSchema.parse(data) : data;

    return NextResponse.json(validated);
  };
};

export const createPostHandler = <TRequest, TResponse>(
  apiFn: (data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema?: ParseSchema<TResponse>,
) => {
  return async (request: Request) => {
    const body = await request.json();
    const data = requestSchema.parse(body);
    const result = await apiFn(data);
    const validated = responseSchema ? responseSchema.parse(result) : result;

    return NextResponse.json(validated);
  };
};

export const createPutHandler = <TRequest, TResponse>(
  apiFn: (id: string, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema?: ParseSchema<TResponse>,
) => {
  return async (request: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const body = await request.json();
    const data = requestSchema.parse(body);
    const result = await apiFn(id, data);
    const validated = responseSchema ? responseSchema.parse(result) : result;

    return NextResponse.json(validated);
  };
};

export const createDeleteHandler = (
  apiFn: (id: string) => Promise<void>,
  paramsSchema: ParseSchema<{ id: string }>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);

    await apiFn(id);

    return NextResponse.json({ success: true });
  };
};

export const createToggleHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  responseSchema?: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const result = await apiFn(id);
    const validated = responseSchema ? responseSchema.parse(result) : result;

    return NextResponse.json(validated);
  };
};

export const createMultiToggleHandler = <TField extends string, TResponse>(
  handlers: Record<TField, (id: string) => Promise<TResponse>>,
  paramsSchema: ParseSchema<{ id: string }>,
  querySchema: ParseSchema<{ field: TField }>,
  responseSchema?: ParseSchema<TResponse>,
) => {
  return async (request: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const { field } = querySchema.parse({
      field: new URL(request.url).searchParams.get("field"),
    });
    const result = await handlers[field](id);
    const validated = responseSchema ? responseSchema.parse(result) : result;

    return NextResponse.json(validated);
  };
};
