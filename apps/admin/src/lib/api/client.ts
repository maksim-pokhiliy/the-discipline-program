"use client";

import { ApiClient } from "@repo/api";

import { apiConfig } from "./config";

export const apiClient = new ApiClient({
  baseUrl: apiConfig.baseUrl,
});
