import { api } from "@app/lib/api";
import { ReviewsPageClient } from "@app/modules/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const initialData = await api.reviews.getPageData();

  return <ReviewsPageClient initialData={initialData} />;
}
