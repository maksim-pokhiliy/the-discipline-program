import { withPublicRoute } from "@repo/api-routes";
import { mobileCompatRoutes } from "@repo/api-server/mobile-compat";

export const GET = withPublicRoute(mobileCompatRoutes.trainingLevels);
