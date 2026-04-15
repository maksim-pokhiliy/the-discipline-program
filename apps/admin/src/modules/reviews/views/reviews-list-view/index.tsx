"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useReviewsPageData } from "@app/lib/hooks";

import { ReviewsListSection } from "../../sections";

export const ReviewsListView = () => (
  <AdminListView
    queryResult={useReviewsPageData()}
    loadingMessage="Loading reviews..."
    title="Reviews"
    subtitle="Curate client testimonials displayed on the storefront"
  >
    {(data) => <ReviewsListSection reviews={data.reviews} />}
  </AdminListView>
);
