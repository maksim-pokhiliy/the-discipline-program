"use client";

import * as endpoints from "./endpoints";

export const api = {
  blog: endpoints.blogAPI,
  contacts: endpoints.contactsAPI,
  dashboard: endpoints.dashboardAPI,
  programs: endpoints.programsAPI,
  reviews: endpoints.reviewsAPI,
  upload: endpoints.uploadAPI,
};
