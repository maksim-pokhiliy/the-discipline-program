import { api } from "@app/lib/api";
import { ReviewsListView } from "@app/modules/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const initialData = await api.reviews.getPageData();

  return <ReviewsListView initialData={initialData} />;
}
