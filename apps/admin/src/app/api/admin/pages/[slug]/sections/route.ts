import { createPatchByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import {
  marketingPagePath,
  pageSlugRouteParamsSchema,
  updatePageSectionBodySchema,
} from "@repo/contracts/cms/pages";
import { baseEnv } from "@repo/env/base";
import { logger } from "@repo/shared";

import { withAdminAuth } from "@app/lib/server/auth";

const REVALIDATE_TIMEOUT_MS = 10_000;
const REVALIDATE_ERROR_BODY_PREVIEW_LENGTH = 200;

async function triggerMarketingRevalidation(path: string): Promise<void> {
  const secret = baseEnv.REVALIDATE_SECRET;

  if (!secret) {
    logger.warn("marketing revalidation skipped: REVALIDATE_SECRET not set", { path });

    return;
  }

  const url = `${baseEnv.NEXT_PUBLIC_MARKETING_URL}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });

    if (!response.ok) {
      const body = await response.text().catch(() => "");

      logger.error("marketing revalidation returned non-2xx", {
        path,
        status: response.status,
        body: body.slice(0, REVALIDATE_ERROR_BODY_PREVIEW_LENGTH),
      });
    }
  } catch (err) {
    logger.error("failed to revalidate marketing page", { path, err });
  } finally {
    clearTimeout(timeout);
  }
}

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      async ({ slug }, body) => {
        await cmsPagesAdminApi.updateSection({ ...body, pageSlug: slug });
        await triggerMarketingRevalidation(marketingPagePath(slug, body.locale));
      },
      pageSlugRouteParamsSchema,
      updatePageSectionBodySchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
