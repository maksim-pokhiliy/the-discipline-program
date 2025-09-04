"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";
import { Review } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { ContentSection } from "@app/shared/components/ui/content-section";

import { ReviewModal } from "../../components";
import { ReviewsTable } from "../../components/reviews-table";
import { createDuplicateReview } from "../../utils/review-duplication";

interface ReviewsTableSectionProps {
  reviews: Review[];
}

export const ReviewsTableSection = ({ reviews }: ReviewsTableSectionProps) => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const modal = useModal();

  const handleCreateReview = () => {
    setSelectedReview(null);
    modal.open();
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    modal.open();
  };

  const handleDuplicateReview = (review: Review) => {
    const duplicateData = createDuplicateReview(review, reviews);

    setSelectedReview({
      ...duplicateData,
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    modal.open();
  };

  const handleCloseModal = () => {
    modal.close();
    setSelectedReview(null);
  };

  return (
    <ContentSection
      title="Client Reviews"
      subtitle="Manage testimonials and feedback from your clients"
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateReview}
            size="small"
          >
            Add New Review
          </Button>
        </Stack>

        <ReviewsTable
          reviews={reviews}
          onEditReview={handleEditReview}
          onDuplicateReview={handleDuplicateReview}
        />

        <ReviewModal open={modal.isOpen} onClose={handleCloseModal} review={selectedReview} />
      </Stack>
    </ContentSection>
  );
};
