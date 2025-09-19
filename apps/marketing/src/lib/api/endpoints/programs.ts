import { Program } from "@repo/api";

import { apiClient } from "../client";

export const programsAPI = {
  getAll: (): Promise<Program[]> => apiClient.request("/api/marketing/programs"),
};
