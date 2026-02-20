"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Avatar,
  Box,
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
import { useDeleteConfirmation } from "@repo/query";
import { formatDate } from "@repo/shared";
import { ConfirmationModal, DataTable, type Column, type DataTableFilter } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useDeleteReview, useToggleReviewActive } from "@app/lib/hooks";

const filters: DataTableFilter<Review>[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Hidden", value: "hidden" },
    ],
    match: (item, value) => (value === "active" ? item.isActive : !item.isActive),
  },
];

interface ReviewsListSectionProps {
  reviews: Review[];
}

export const ReviewsListSection = ({ reviews }: ReviewsListSectionProps) => {
  const toggleActiveMutation = useToggleReviewActive();
  const deleteMutation = useDeleteReview();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const columns: Column<Review>[] = [
    {
      id: "author",
      label: "Author",
      width: "30%",
      sortable: true,
      sortValue: (review) => review.authorName,
      searchValue: (review) => review.authorName,
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
      sortable: true,
      sortValue: (review) => review.rating,
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
            disabled={
              toggleActiveMutation.isPending && toggleActiveMutation.variables === review.id
            }
            onChange={() => toggleActiveMutation.mutate(review.id)}
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
      sortable: true,
      sortValue: (review) => new Date(review.createdAt).getTime(),
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
            <IconButton onClick={() => requestDelete(review.id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={reviews}
        columns={columns}
        title="Reviews"
        searchPlaceholder="Search by author..."
        filters={filters}
        action={<CreateButton href="/reviews/create">Create Review</CreateButton>}
        paginated
        emptyMessage="No reviews found. Add your first review!"
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        details="This action cannot be undone."
        confirmText="Delete"
        type="danger"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </>
  );
};
