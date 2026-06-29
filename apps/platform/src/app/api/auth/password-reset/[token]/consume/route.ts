import { NextResponse } from "next/server";

import {
  parseJsonBody,
  parseRequest,
  parseResponse,
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

const consumePasswordResetHandler = async (
  request: Request,
  context: RouteContext,
): Promise<Response> => {
  const { token } = parseRequest(consumePasswordResetParamsSchema, await context.params);
  const body = await parseJsonBody(request);
  const input = parseRequest(consumePasswordResetRequestSchema, body);
  const result = await iamPasswordResetApi.consume(token, { password: input.password });
  const validated = parseResponse(consumePasswordResetResponseSchema, result);

  return NextResponse.json(validated);
};

export const POST = withPublicRoute(
  withRateLimit(consumePasswordResetHandler, RATE_LIMIT_TIER.AUTH),
);
