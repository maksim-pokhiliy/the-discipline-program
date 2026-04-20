import { createPatchByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import {
  PAGE_SLUG_PATH_MAP,
  pageSlugRouteParamsSchema,
  updatePageSectionBodySchema,
} from "@repo/contracts/cms/pages";
import { baseEnv } from "@repo/env/base";
import { logger } from "@repo/shared";

import { withAdminAuth } from "@app/lib/server/auth";

async function triggerMarketingRevalidation(slug: string): Promise<void> {
  const secret = baseEnv.REVALIDATE_SECRET;
  const path = PAGE_SLUG_PATH_MAP[slug as keyof typeof PAGE_SLUG_PATH_MAP];

  if (!secret) {
    logger.warn("marketing revalidation skipped: REVALIDATE_SECRET not set", { slug });

    return;
  }

  if (!path) {
    logger.warn("marketing revalidation skipped: slug not in PAGE_SLUG_PATH_MAP", { slug });

    return;
  }

  const url = `${baseEnv.NEXT_PUBLIC_MARKETING_URL}/api/revalidate?secret=${encodeURIComponent(secret)}&path=${encodeURIComponent(path)}`;

  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      const body = await response.text().catch(() => "");

      logger.error("marketing revalidation returned non-2xx", {
        slug,
        path,
        status: response.status,
        body: body.slice(0, 200),
      });
    }
  } catch (err) {
    logger.error("failed to revalidate marketing page", { slug, path, err });
  }
}

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      async ({ slug }, body) => {
        await cmsPagesAdminApi.updateSection({ ...body, pageSlug: slug });
        await triggerMarketingRevalidation(slug);
      },
      pageSlugRouteParamsSchema,
      updatePageSectionBodySchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
