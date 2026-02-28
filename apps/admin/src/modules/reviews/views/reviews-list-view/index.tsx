"use client";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useReviewsPageData } from "@app/lib/hooks";

import { ReviewsListSection } from "../../sections";

export const ReviewsListView = () => (
  <AdminListView queryResult={useReviewsPageData()} loadingMessage="Loading reviews...">
    {(data) => <ReviewsListSection reviews={data.reviews} />}
  </AdminListView>
);
