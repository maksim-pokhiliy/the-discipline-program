import { createReadyHandler, withPublicRoute } from "@repo/api-routes";
import { checkBlobStorage, checkDatabase } from "@repo/api-server/ops";

export const GET = withPublicRoute(createReadyHandler(checkDatabase, checkBlobStorage));
