"use client";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { Review } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useReviewMutations } from "@app/lib/hooks";

import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ReviewRow } from "./review-row";

interface ReviewsTableProps {
  reviews: Review[];
  onEditReview: (review: Review) => void;
  onDuplicateReview: (review: Review) => void;
}

type SortField = keyof Pick<Review, "authorName" | "rating" | "sortOrder" | "createdAt">;
type SortDirection = "asc" | "desc";

export const ReviewsTable = ({ reviews, onEditReview, onDuplicateReview }: ReviewsTableProps) => {
  const deleteModal = useModal();
  const { deleteReview, toggleActive, toggleFeatured } = useReviewMutations();

  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [togglingReviewId, setTogglingReviewId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "authorName":
        aValue = a.authorName.toLowerCase();
        bValue = b.authorName.toLowerCase();
        break;
      case "rating":
        aValue = a.rating;
        bValue = b.rating;
        break;
      case "sortOrder":
        aValue = a.sortOrder;
        bValue = b.sortOrder;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
    deleteModal.open();
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteReview.mutateAsync(reviewToDelete.id);
      deleteModal.close();
      setReviewToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleToggleActive = async (reviewId: string) => {
    setTogglingReviewId(reviewId);

    try {
      await toggleActive.mutateAsync(reviewId);
    } catch (error) {
      console.error("Toggle active failed:", error);
    } finally {
      setTogglingReviewId(null);
    }
  };

  const handleToggleFeatured = async (reviewId: string) => {
    setTogglingFeaturedId(reviewId);

    try {
      await toggleFeatured.mutateAsync(reviewId);
    } catch (error) {
      console.error("Toggle featured failed:", error);
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === "authorName"}
                  direction={sortField === "authorName" ? sortDirection : "asc"}
                  onClick={() => handleSort("authorName")}
                >
                  Author
                </TableSortLabel>
              </TableCell>

              <TableCell>Review Text</TableCell>

              <TableCell>
                <TableSortLabel
                  active={sortField === "rating"}
                  direction={sortField === "rating" ? sortDirection : "asc"}
                  onClick={() => handleSort("rating")}
                >
                  Rating
                </TableSortLabel>
              </TableCell>

              <TableCell>Status</TableCell>

              <TableCell>Featured</TableCell>

              <TableCell>Program</TableCell>

              <TableCell>
                <TableSortLabel
                  active={sortField === "sortOrder"}
                  direction={sortField === "sortOrder" ? sortDirection : "asc"}
                  onClick={() => handleSort("sortOrder")}
                >
                  Sort Order
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedReviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                onEdit={() => onEditReview(review)}
                onDelete={() => handleDeleteClick(review)}
                onDuplicate={() => onDuplicateReview(review)}
                onToggleActive={() => handleToggleActive(review.id)}
                onToggleFeatured={() => handleToggleFeatured(review.id)}
                isTogglingActive={togglingReviewId === review.id}
                isTogglingFeatured={togglingFeaturedId === review.id}
              />
            ))}
          </TableBody>
        </Table>

        {reviews.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            No reviews found. Create your first review to get started.
          </Box>
        )}
      </TableContainer>

      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        review={reviewToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteReview.isPending}
        error={deleteReview.error?.message || null}
      />
    </>
  );
};
