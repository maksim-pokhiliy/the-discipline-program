import {
  type CreateContactSubmissionRequest,
  type CreateContactSubmissionResponse,
} from "@repo/contracts/contact";

import { apiClient } from "../client";

export const contactAPI = {
  submit: (data: CreateContactSubmissionRequest): Promise<CreateContactSubmissionResponse> =>
    apiClient.request("api/public/contact", "POST", data),
};
