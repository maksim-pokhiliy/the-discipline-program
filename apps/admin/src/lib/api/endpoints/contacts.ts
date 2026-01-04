import { type ContactSubmission } from "@repo/contracts/contact";

import { apiClient } from "../client";

export const contactsAPI = {
  getAll: (): Promise<ContactSubmission[]> => apiClient.request("api/admin/contacts"),
};
