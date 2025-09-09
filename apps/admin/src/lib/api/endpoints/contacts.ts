"use client";

import { ContactSubmission } from "@repo/api";

import { apiClient } from "../client";

export const contactsAPI = {
  getAll: (): Promise<ContactSubmission[]> => apiClient.request("/api/contacts"),
};
