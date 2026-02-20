import { api } from "@app/lib/api";
import { fetchOrNotFound } from "@app/lib/server/fetch-or-not-found";
import { ReviewsEditView } from "@app/modules/reviews";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReviewsEditPage({ params }: PageProps) {
  const { id } = await params;
  const review = await fetchOrNotFound(() => api.reviews.getById(id));

  return <ReviewsEditView initialData={review} />;
}
