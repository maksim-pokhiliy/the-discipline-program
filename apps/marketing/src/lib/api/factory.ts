import { type ApiClient } from "@repo/api-client";

import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  pages: endpoints.createPagesAPI(client),
  contact: endpoints.createContactAPI(client),
});
