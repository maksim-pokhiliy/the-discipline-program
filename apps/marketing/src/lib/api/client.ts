import { ApiClient } from "@repo/api";

import apiConfig from "./config";

export const marketingApiClient = new ApiClient({
  baseUrl: apiConfig.baseUrl,
});
