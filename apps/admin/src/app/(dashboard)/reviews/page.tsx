import { serverApi } from "@app/lib/api/server";
import { ReviewsListView } from "@app/modules/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const initialData = await serverApi.reviews.getPageData();

  return <ReviewsListView initialData={initialData} />;
}
