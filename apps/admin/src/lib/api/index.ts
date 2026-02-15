import * as endpoints from "./endpoints";

export const api = {
  blog: endpoints.blogAPI,
  contacts: endpoints.contactsAPI,
  dashboard: endpoints.dashboardAPI,
  exerciseCategories: endpoints.exerciseCategoriesAPI,
  exercises: endpoints.exercisesAPI,
  pages: endpoints.pagesAPI,
  products: endpoints.productsAPI,
  reviews: endpoints.reviewsAPI,
  upload: endpoints.uploadAPI,
};
