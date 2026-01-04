import * as endpoints from "./endpoints";

export const api = {
  contacts: endpoints.contactsAPI,
  dashboard: endpoints.dashboardAPI,
  programs: endpoints.programsAPI,
  reviews: endpoints.reviewsAPI,
  upload: endpoints.uploadAPI,
  blog: endpoints.blogAPI,
};
