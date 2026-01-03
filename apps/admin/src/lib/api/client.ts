import { ApiClient } from "@repo/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
});
