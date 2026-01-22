"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Rating,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { type Review } from "@repo/contracts/review";
import { ConfirmationModal, DataTable, type Column, PanelSection } from "@repo/ui";

import { useDeleteReview, useToggleReviewActive } from "@app/lib/hooks";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
};

interface ReviewsListSectionProps {
  reviews: Review[];
}

export const ReviewsListSection = ({ reviews }: ReviewsListSectionProps) => {
  const { mutateAsync: toggleActive } = useToggleReviewActive();
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleActive = async (id: string) => {
    setLoadingId(id);
    try {
      await toggleActive(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteReview(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: Column<Review>[] = [
    {
      id: "author",
      label: "Author",
      width: "30%",
      render: (review) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={review.authorAvatar || undefined} alt={review.authorName}>
            {review.authorName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{review.authorName}</Typography>
            {review.authorRole && (
              <Typography variant="caption" color="text.secondary">
                {review.authorRole}
              </Typography>
            )}
          </Box>
        </Stack>
      ),
    },
    {
      id: "rating",
      label: "Rating",
      width: "15%",
      render: (review) => <Rating value={review.rating} readOnly size="small" />,
    },
    {
      id: "text",
      label: "Review",
      width: "35%",
      render: (review) => (
        <Tooltip title={review.text}>
          <Typography
            variant="body2"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {review.text}
          </Typography>
        </Tooltip>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      width: "10%",
      render: (review) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={review.isActive}
            disabled={loadingId === review.id}
            onChange={() => handleToggleActive(review.id)}
            color="success"
          />
          <Chip
            label={review.isActive ? "Active" : "Hidden"}
            color={review.isActive ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        </Stack>
      ),
    },
    {
      id: "createdAt",
      label: "Date",
      width: "10%",
      render: (review) => <Typography variant="body2">{formatDate(review.createdAt)}</Typography>,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (review) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton
              component={Link}
              href={`/reviews/${review.id}`}
              size="small"
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => setDeleteId(review.id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PanelSection
        title="All Reviews"
        action={
          <Button
            component={Link}
            href="/reviews/create"
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            Create Review
          </Button>
        }
      >
        <DataTable
          data={reviews}
          columns={columns}
          emptyMessage="No reviews found. Add your first review!"
        />
      </PanelSection>

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        details="This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
};
