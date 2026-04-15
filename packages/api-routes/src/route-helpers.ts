import { NextResponse } from "next/server";
import { type ZodType, type ZodTypeDef } from "zod";

import { BadRequestError } from "@repo/errors";

import { handleApiError } from "./error-handler";
import { type RouteContext, type RouteHandler } from "./types";

type ParseSchema<T> = ZodType<T, ZodTypeDef, unknown>;

export const parseJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON in request body");
  }
};

export const withErrorHandling =
  (fn: RouteHandler): RouteHandler =>
  async (request, context) => {
    const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

    try {
      const response = await fn(request, context);

      response.headers.set("x-request-id", requestId);

      return response;
    } catch (error) {
      return handleApiError(error, requestId);
    }
  };

export const withPublicRoute = (handler: RouteHandler): RouteHandler => withErrorHandling(handler);

export const createGetHandler = <TResponse>(
  apiFn: () => Promise<TResponse>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async () => {
    const data = await apiFn();
    const validated = responseSchema.parse(data);

    return NextResponse.json(validated);
  };
};

export const createGetByIdHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const data = await apiFn(id);
    const validated = responseSchema.parse(data);

    return NextResponse.json(validated);
  };
};

export const createPostHandler = <TRequest, TResponse>(
  apiFn: (data: TRequest) => Promise<TResponse>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (request: Request) => {
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  };
};

export const createPutHandler = <TRequest, TResponse>(
  apiFn: (id: string, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (request: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(id, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated);
  };
};

export const createGetByParamHandler = <TParams, TResponse>(
  apiFn: (params: TParams) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);
    const data = await apiFn(params);
    const validated = responseSchema.parse(data);

    return NextResponse.json(validated);
  };
};

export const createPatchByParamHandler = <TParams, TRequest>(
  apiFn: (params: TParams, data: TRequest) => Promise<void>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
) => {
  return async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);

    await apiFn(params, data);

    return new NextResponse(null, { status: 204 });
  };
};

export const createFormDataPostHandler = <TResponse>(
  apiFn: (formData: FormData) => Promise<TResponse>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (request: Request) => {
    const formData = await request.formData();
    const result = await apiFn(formData);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  };
};

export const createDeleteWithBodyHandler = <TRequest>(
  apiFn: (data: TRequest) => Promise<void>,
  requestSchema: ParseSchema<TRequest>,
) => {
  return async (request: Request) => {
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);

    await apiFn(data);

    return new NextResponse(null, { status: 204 });
  };
};

export const createDeleteHandler = (
  apiFn: (id: string) => Promise<void>,
  paramsSchema: ParseSchema<{ id: string }>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);

    await apiFn(id);

    return new NextResponse(null, { status: 204 });
  };
};

export const createToggleHandler = <TResponse>(
  apiFn: (id: string) => Promise<TResponse>,
  paramsSchema: ParseSchema<{ id: string }>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (_: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const result = await apiFn(id);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated);
  };
};

export const createMultiToggleHandler = <TField extends string, TResponse>(
  handlers: Record<TField, (id: string) => Promise<TResponse>>,
  paramsSchema: ParseSchema<{ id: string }>,
  querySchema: ParseSchema<{ field: TField }>,
  responseSchema: ParseSchema<TResponse>,
) => {
  return async (request: Request, context: RouteContext) => {
    const { id } = paramsSchema.parse(await context.params);
    const { field } = querySchema.parse({
      field: new URL(request.url).searchParams.get("field"),
    });
    const result = await handlers[field](id);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated);
  };
};
