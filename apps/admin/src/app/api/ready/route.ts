import { createReadyHandler, withPublicRoute } from "@repo/api-routes";
import { checkDatabase } from "@repo/api-server/ops";

export const GET = withPublicRoute(createReadyHandler(checkDatabase));
