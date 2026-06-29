import { NextResponse } from "next/server";

import {
  parseJsonBody,
  parseRequest,
  parseResponse,
  RATE_LIMIT_TIER,
  withPublicRoute,
  withRateLimit,
} from "@repo/api-routes";
import { iamPasswordResetApi } from "@repo/api-server/iam";
import {
  requestPasswordResetRequestSchema,
  requestPasswordResetResponseSchema,
} from "@repo/contracts/iam/password-reset";

const requestPasswordResetHandler = async (request: Request): Promise<Response> => {
  const body = await parseJsonBody(request);
  const input = parseRequest(requestPasswordResetRequestSchema, body);

  await iamPasswordResetApi.request(input.email);
  const validated = parseResponse(requestPasswordResetResponseSchema, { success: true });

  return NextResponse.json(validated);
};

export const POST = withPublicRoute(
  withRateLimit(requestPasswordResetHandler, RATE_LIMIT_TIER.AUTH),
);
