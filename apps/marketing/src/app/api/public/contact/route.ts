import { createPostHandler, withPublicRoute } from "@repo/api-routes";
import { cmsContactInboundApi } from "@repo/api-server/cms";
import {
  createContactSubmissionRequestSchema,
  createContactSubmissionResponseSchema,
} from "@repo/contracts/cms/contact";

export const POST = withPublicRoute(
  createPostHandler(async (data) => {
    const result = await cmsContactInboundApi.createSubmission(data);

    return createContactSubmissionResponseSchema.parse(result);
  }, createContactSubmissionRequestSchema),
);
