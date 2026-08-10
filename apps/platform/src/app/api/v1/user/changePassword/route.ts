import { withPublicRoute } from "@repo/api-routes";
import { mobileCompatRoutes } from "@repo/api-server/mobile-compat";

import { withMobileBearerAuth } from "@app/lib/server/mobile-shim-auth";

export const PATCH = withPublicRoute(withMobileBearerAuth(mobileCompatRoutes.changePassword));
