import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  blog: endpoints.createBlogAPI(client),
  blockTypes: endpoints.createBlockTypesAPI(client),
  contacts: endpoints.createContactsAPI(client),
  dashboard: endpoints.createDashboardAPI(client),
  dayTypes: endpoints.createDayTypesAPI(client),
  exercises: endpoints.createExercisesAPI(client),
  pages: endpoints.createPagesAPI(client),
  products: endpoints.createProductsAPI(client),
  reviews: endpoints.createReviewsAPI(client),
  schemeTypes: endpoints.createSchemeTypesAPI(client),
  upload: endpoints.createUploadAPI(client),
  users: endpoints.createUsersAPI(client),
});

export const api = createApi(browserApiClient);
