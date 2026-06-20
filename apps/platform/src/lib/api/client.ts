import { ApiClient } from "@repo/api-client";

export const browserApiClient = new ApiClient({
  baseUrl: "",
  credentials: "include",
  timeoutMs: 20_000,
  maxTotalDurationMs: 45_000,
});
