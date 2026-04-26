import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  blog: endpoints.createBlogAPI(client),
  contacts: endpoints.createContactsAPI(client),
  dashboard: endpoints.createDashboardAPI(client),
  library: {
    exercises: endpoints.createLibraryExercisesAPI(client),
  },
  pages: endpoints.createPagesAPI(client),
  products: endpoints.createProductsAPI(client),
  reviews: endpoints.createReviewsAPI(client),
  upload: endpoints.createUploadAPI(client),
  users: endpoints.createUsersAPI(client),
});

export const api = createApi(browserApiClient);
