import { withCredentialsRateLimit, withPublicRoute } from "@repo/api-routes";
import { mobileCompatRoutes } from "@repo/api-server/mobile-compat";

import { MOBILE_SHIM_SIGNIN_RATE_LIMIT } from "@app/lib/server/mobile-shim-rate-limit";

export const POST = withPublicRoute(
  withCredentialsRateLimit(mobileCompatRoutes.signin, MOBILE_SHIM_SIGNIN_RATE_LIMIT),
);
