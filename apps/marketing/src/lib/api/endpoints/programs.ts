import { type Program } from "@repo/contracts/program";

import { apiClient } from "../client";

export const programsAPI = {
  getAll: (): Promise<Program[]> => apiClient.request("/api/public/programs"),
};
