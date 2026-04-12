import { createHealthHandler, withPublicRoute } from "@repo/api-routes";

export const GET = withPublicRoute(createHealthHandler());
