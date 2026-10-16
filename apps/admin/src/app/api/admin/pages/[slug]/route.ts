import { NextResponse } from "next/server";

import {
  createPatchByParamHandler,
  parseRequest,
  parseResponse,
  RATE_LIMIT_TIER,
  type RouteContext,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import { localeQuerySchema } from "@repo/contracts/cms/locale";
import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  updatePageMetadataSchema,
} from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

const getPageDetails = async (request: Request, context: RouteContext): Promise<Response> => {
  const { slug } = parseRequest(pageSlugRouteParamsSchema, await context.params);
  const { locale } = parseRequest(
    localeQuerySchema,
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  const details = await cmsPagesAdminApi.getPageBySlug(slug, locale);

  return NextResponse.json(parseResponse(adminPageDetailsSchema, details));
};

export const GET = withAdminAuth(withAuthRateLimit(getPageDetails, RATE_LIMIT_TIER.API));

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      ({ slug }, data) => cmsPagesAdminApi.updatePageMetadata(slug, data),
      pageSlugRouteParamsSchema,
      updatePageMetadataSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
