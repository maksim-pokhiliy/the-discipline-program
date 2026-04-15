import { browserApiClient } from "./client";
import { createApi } from "./factory";

export { createApi };

export const api = createApi(browserApiClient);
