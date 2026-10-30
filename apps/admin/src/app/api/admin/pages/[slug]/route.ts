import { NextResponse } from "next/server";

import {
  parseQuery,
  parseRequest,
  parseResponse,
  RATE_LIMIT_TIER,
  type RouteContext,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import { localeQuerySchema } from "@repo/contracts/cms/locale";
import { adminPageDetailsSchema, pageSlugRouteParamsSchema } from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

const getPageDetails = async (request: Request, context: RouteContext): Promise<Response> => {
  const { slug } = parseRequest(pageSlugRouteParamsSchema, await context.params);
  const { locale } = parseQuery(localeQuerySchema, request);
  const details = await cmsPagesAdminApi.getPageBySlug(slug, locale);

  return NextResponse.json(parseResponse(adminPageDetailsSchema, details));
};

export const GET = withAdminAuth(withAuthRateLimit(getPageDetails, RATE_LIMIT_TIER.API));
