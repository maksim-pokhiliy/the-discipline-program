import { ApiClient } from "@repo/api-client";
import { env } from "@repo/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
});
