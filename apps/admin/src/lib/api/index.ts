import * as endpoints from "./endpoints";

export const api = {
  contacts: endpoints.contactsAPI,
  dashboard: endpoints.dashboardAPI,
  storefront: endpoints.storefrontAPI,
  reviews: endpoints.reviewsAPI,
  upload: endpoints.uploadAPI,
  blog: endpoints.blogAPI,
  pages: endpoints.pagesAPI,
};
