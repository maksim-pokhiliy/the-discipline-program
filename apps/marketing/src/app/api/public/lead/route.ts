import {
  createPostHandler,
  withPublicRoute,
  withRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { cmsLeadInboundApi } from "@repo/api-server/cms";
import {
  type CreateLeadSubmissionResponse,
  createLeadSubmissionRequestSchema,
  createLeadSubmissionResponseSchema,
} from "@repo/contracts/cms/contact";

export const POST = withPublicRoute(
  withRateLimit(
    createPostHandler(
      async (data): Promise<CreateLeadSubmissionResponse> => {
        await cmsLeadInboundApi.createLead(data);

        return { success: true, message: "Lead submission received" };
      },
      createLeadSubmissionRequestSchema,
      createLeadSubmissionResponseSchema,
    ),
    RATE_LIMIT_TIER.PUBLIC,
  ),
);
