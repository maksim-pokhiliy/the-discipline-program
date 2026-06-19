import { NextResponse } from "next/server";

import {
  RATE_LIMIT_TIER,
  type RouteContext,
  withPublicRoute,
  withRateLimit,
} from "@repo/api-routes";
import { iamPasswordResetApi } from "@repo/api-server/iam";
import {
  consumePasswordResetParamsSchema,
  consumePasswordResetRequestSchema,
  consumePasswordResetResponseSchema,
} from "@repo/contracts/iam/password-reset";
import { BadRequestError } from "@repo/errors";

const parseRequestBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON in request body");
  }
};

const consumePasswordResetHandler = async (
  request: Request,
  context: RouteContext,
): Promise<Response> => {
  const { token } = consumePasswordResetParamsSchema.parse(await context.params);
  const body = await parseRequestBody(request);
  const input = consumePasswordResetRequestSchema.parse(body);
  const result = await iamPasswordResetApi.consume(token, { password: input.password });
  const validated = consumePasswordResetResponseSchema.parse(result);

  return NextResponse.json(validated);
};

export const POST = withPublicRoute(
  withRateLimit(consumePasswordResetHandler, RATE_LIMIT_TIER.AUTH),
);
