import { type ApiClient } from "@repo/api-client";

import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  blog: endpoints.createBlogAPI(client),
  contact: endpoints.createContactAPI(client),
  lead: endpoints.createLeadAPI(client),
  pages: endpoints.createPagesAPI(client),
});
