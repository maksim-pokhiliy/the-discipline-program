import { NextResponse } from "next/server";
import { z } from "zod";

import { parseQuery, parseResponse, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import { localeQuerySchema } from "@repo/contracts/cms/locale";
import { adminPageListItemSchema } from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

const getPages = async (request: Request): Promise<Response> => {
  const { locale } = parseQuery(localeQuerySchema, request);
  const pages = await cmsPagesAdminApi.getPages(locale);

  return NextResponse.json(parseResponse(z.array(adminPageListItemSchema), pages));
};

export const GET = withAdminAuth(withAuthRateLimit(getPages, RATE_LIMIT_TIER.API));
