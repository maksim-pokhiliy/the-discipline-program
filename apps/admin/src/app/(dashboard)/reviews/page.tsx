import { adminReviewsApi } from "@repo/api/server";

import { ReviewsPageClient } from "@app/modules/reviews";

export default async function ReviewsPage() {
  const initialData = await adminReviewsApi.getReviewsPageData();

  return <ReviewsPageClient initialData={initialData} />;
}
