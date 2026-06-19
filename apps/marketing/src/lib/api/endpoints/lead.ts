import { type ApiClient } from "@repo/api-client";
import {
  type CreateLeadSubmissionRequest,
  type CreateLeadSubmissionResponse,
} from "@repo/contracts/cms/contact";

export const createLeadAPI = (client: ApiClient) => ({
  submit: (data: CreateLeadSubmissionRequest): Promise<CreateLeadSubmissionResponse> =>
    client.request("/api/public/lead", "POST", data),
});
