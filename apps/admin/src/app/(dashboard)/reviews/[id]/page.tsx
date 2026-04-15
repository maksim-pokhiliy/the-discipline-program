import { ReviewsEditView } from "@app/modules/reviews";

type PageProps = {
  params: Promise<{ id: string }>;
};

const ReviewsEditPage = async ({ params }: PageProps) => {
  const { id } = await params;

  return <ReviewsEditView id={id} />;
};

export default ReviewsEditPage;
