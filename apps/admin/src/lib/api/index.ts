"use client";

import * as endpoints from "./endpoints";

export const api = {
  contacts: endpoints.contactsAPI,
  dashboard: endpoints.dashboardAPI,
  programs: endpoints.programsAPI,
  reviews: endpoints.reviewsAPI,
  blog: endpoints.blogAPI,
  upload: endpoints.uploadAPI,
};
