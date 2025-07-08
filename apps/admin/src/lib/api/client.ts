import { ApiClient } from "@repo/api";

import apiConfig from "./config";

export const adminApiClient = new ApiClient({
  baseUrl: apiConfig.baseUrl,
});
