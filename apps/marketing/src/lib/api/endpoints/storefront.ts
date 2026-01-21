import { type StorefrontProgram } from "@repo/contracts/storefront";

import { apiClient } from "../client";

export const storefrontAPI = {
  getAll: (): Promise<StorefrontProgram[]> => apiClient.request("/api/public/storefront"),
};
