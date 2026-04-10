import { createPostHandler, withPublicRoute } from "@repo/api-routes";
import { contactApi } from "@repo/api-server";
import {
  createContactSubmissionRequestSchema,
  createContactSubmissionResponseSchema,
} from "@repo/contracts/cms/contact";

export const POST = withPublicRoute(
  createPostHandler(async (data) => {
    const result = await contactApi.createSubmission(data);

    return createContactSubmissionResponseSchema.parse(result);
  }, createContactSubmissionRequestSchema),
);
