import { createVersionHandler, withPublicRoute } from "@repo/api-routes";

export const GET = withPublicRoute(createVersionHandler());
