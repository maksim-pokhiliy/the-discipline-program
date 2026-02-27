import { type ApiClient } from "@repo/api-client";
import {
  type CreateContactSubmissionRequest,
  type CreateContactSubmissionResponse,
} from "@repo/contracts/contact";

export const createContactAPI = (client: ApiClient) => ({
  submit: (data: CreateContactSubmissionRequest): Promise<CreateContactSubmissionResponse> =>
    client.request("/api/public/contact", "POST", data),
});
