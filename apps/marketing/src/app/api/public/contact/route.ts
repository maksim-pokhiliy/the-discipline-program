import { createPostHandler, withPublicRoute } from "@repo/api-routes";
import { cmsContactInboundApi } from "@repo/api-server/cms";
import {
  type CreateContactSubmissionResponse,
  createContactSubmissionRequestSchema,
  createContactSubmissionResponseSchema,
} from "@repo/contracts/cms/contact";

export const POST = withPublicRoute(
  createPostHandler(
    async (data): Promise<CreateContactSubmissionResponse> => {
      await cmsContactInboundApi.createSubmission(data);

      return { success: true, message: "Contact submission received" };
    },
    createContactSubmissionRequestSchema,
    createContactSubmissionResponseSchema,
  ),
);
