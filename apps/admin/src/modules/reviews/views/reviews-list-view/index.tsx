"use client";

import { type AdminReviewsPageData } from "@repo/contracts/review";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useReviewsPageData } from "@app/lib/hooks";

import { ReviewsListSection } from "../../sections";

interface ReviewsListViewProps {
  initialData: AdminReviewsPageData;
}

export const ReviewsListView = ({ initialData }: ReviewsListViewProps) => (
  <AdminListView
    queryResult={useReviewsPageData({ initialData })}
    loadingMessage="Loading reviews..."
  >
    {(data) => <ReviewsListSection reviews={data.reviews} />}
  </AdminListView>
);
