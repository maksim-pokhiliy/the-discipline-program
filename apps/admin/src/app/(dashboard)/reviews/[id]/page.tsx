import { notFound } from "next/navigation";

import { api } from "@app/lib/api";
import { ReviewsEditView } from "@app/modules/reviews";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ReviewsEditPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const review = await api.reviews.getById(id);

    return <ReviewsEditView initialData={review} />;
  } catch {
    return notFound();
  }
}
