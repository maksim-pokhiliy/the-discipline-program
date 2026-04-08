import { ReviewsEditView } from "@app/modules/reviews";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReviewsEditPage({ params }: PageProps) {
  const { id } = await params;

  return <ReviewsEditView id={id} />;
}
