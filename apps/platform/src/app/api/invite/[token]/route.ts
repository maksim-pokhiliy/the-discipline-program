import {
  createGetByParamHandler,
  RATE_LIMIT_TIER,
  withPublicRoute,
  withRateLimit,
} from "@repo/api-routes";
import { iamInviteTokenApi } from "@repo/api-server/iam";
import {
  validateInviteParamsSchema,
  validateInviteResponseSchema,
} from "@repo/contracts/iam/invite-token";

export const GET = withPublicRoute(
  withRateLimit(
    createGetByParamHandler(
      ({ token }) => iamInviteTokenApi.validate(token),
      validateInviteParamsSchema,
      validateInviteResponseSchema,
    ),
    RATE_LIMIT_TIER.AUTH,
  ),
);
