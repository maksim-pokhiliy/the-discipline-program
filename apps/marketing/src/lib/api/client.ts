import { ApiClient } from "@repo/api-client";
import { env } from "@repo/env";

export const apiClient = new ApiClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
});
