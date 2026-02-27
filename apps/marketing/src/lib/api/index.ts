import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  pages: endpoints.createPagesAPI(client),
  products: endpoints.createProductsAPI(client),
  reviews: endpoints.createReviewsAPI(client),
  contact: endpoints.createContactAPI(client),
});

export const api = createApi(browserApiClient);
