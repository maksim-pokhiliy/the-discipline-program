import { RATE_LIMIT_TIER, withCredentialsRateLimit, withPublicRoute } from "@repo/api-routes";
import { mobileCompatRoutes } from "@repo/api-server/mobile-compat";

const MOBILE_SHIM_SIGNIN_RATE_LIMIT = {
  ipTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_IP,
  identifierTier: RATE_LIMIT_TIER.MOBILE_SHIM_SIGNIN_ACCOUNT,
  identifierFields: ["username"],
  identifierParse: "json",
} as const;

export const POST = withPublicRoute(
  withCredentialsRateLimit(mobileCompatRoutes.signin, MOBILE_SHIM_SIGNIN_RATE_LIMIT),
);
