"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { createReviewSchema, type CreateReviewData } from "@repo/contracts/review";
import { ContentSection } from "@repo/ui";

import { useCreateReview } from "@app/lib/hooks";

import { ReviewForm } from "../../components";

export const ReviewsCreateView = () => {
  const { mutate: createReview, isPending } = useCreateReview();

  const methods = useForm<CreateReviewData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      authorName: "",
      authorRole: "",
      authorAvatar: null,
      text: "",
      rating: 5,
      isActive: true,
    },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Create Review"
        subtitle="Add a new customer testimonial"
        backHref="/reviews"
        backLabel="Back to List"
        actions={[
          {
            label: "Create Review",
            onClick: handleSubmit((data) => createReview(data)),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <ReviewForm isLoading={isPending} />
      </ContentSection>
    </FormProvider>
  );
};
