"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Box,
} from "@mui/material";
import { Review } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useReviewMutations } from "@app/lib/hooks/use-admin-api";

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
  const { deleteReview, toggleActive, toggleFeatured, updateReviewsOrder } = useReviewMutations();

  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [togglingReviewId, setTogglingReviewId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleToggleActive = async (review: Review) => {
    setTogglingReviewId(review.id);

    await toggleActive.mutateAsync({
      id: review.id,
      isActive: review.isActive,
    });

    setTogglingReviewId(null);
  };

  const handleToggleFeatured = async (review: Review) => {
    setTogglingFeaturedId(review.id);

    await toggleFeatured.mutateAsync({
      id: review.id,
      isFeatured: review.isFeatured,
    });

    setTogglingFeaturedId(null);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedReviews.findIndex((review) => review.id === active.id);
    const newIndex = sortedReviews.findIndex((review) => review.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedReviews = arrayMove(sortedReviews, oldIndex, newIndex);

    try {
      await updateReviewsOrder.mutateAsync(reorderedReviews);
    } catch (error) {
      console.error("Failed to update sort order:", error);
    }
  };

  const isDragEnabled = sortField === "sortOrder" && sortDirection === "asc";

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          overflow: isDragging ? "hidden" : "auto",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
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
              <SortableContext
                items={sortedReviews.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
                disabled={!isDragEnabled}
              >
                {sortedReviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    onEdit={() => onEditReview(review)}
                    onDelete={() => handleDeleteClick(review)}
                    onDuplicate={() => onDuplicateReview(review)}
                    onToggleActive={() => handleToggleActive(review)}
                    onToggleFeatured={() => handleToggleFeatured(review)}
                    isTogglingActive={togglingReviewId === review.id}
                    isTogglingFeatured={togglingFeaturedId === review.id}
                    isDragDisabled={!isDragEnabled}
                    isDragging={isDragging}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>

          {reviews.length === 0 && (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              No reviews found. Create your first review to get started.
            </Box>
          )}
        </DndContext>
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
