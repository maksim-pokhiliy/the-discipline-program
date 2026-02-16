"use client";

import { useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StarIcon from "@mui/icons-material/Star";
import { Button, Chip, IconButton, Stack, Switch, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type BlogPost } from "@repo/contracts/blog";
import { env } from "@repo/env";
import { ConfirmationModal, DataTable, type Column, type DataTableFilter } from "@repo/ui";

import {
  useDeleteBlogPost,
  useToggleBlogFeatured,
  useToggleBlogPost,
} from "@app/lib/hooks/use-blog";
import { useDeleteConfirmation } from "@app/lib/hooks/use-delete-confirmation";

interface BlogListSectionProps {
  posts: BlogPost[];
}

export const BlogListSection = ({ posts }: BlogListSectionProps) => {
  const { mutateAsync: toggleStatus } = useToggleBlogPost();
  const { mutateAsync: toggleFeatured } = useToggleBlogFeatured();
  const deleteMutation = useDeleteBlogPost();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  const [loadingState, setLoadingState] = useState<{
    id: string;
    field: "status" | "featured";
  } | null>(null);

  const handleToggleStatus = async (id: string) => {
    setLoadingState({ id, field: "status" });

    try {
      await toggleStatus(id);
    } finally {
      setLoadingState(null);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    setLoadingState({ id, field: "featured" });

    try {
      await toggleFeatured(id);
    } finally {
      setLoadingState(null);
    }
  };

  const filters: DataTableFilter<BlogPost>[] = [
    {
      id: "status",
      label: "Status",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ],
      match: (item, value) => (value === "published" ? item.isPublished : !item.isPublished),
    },
    {
      id: "spotlight",
      label: "Spotlight",
      options: [
        { label: "Featured", value: "featured" },
        { label: "Standard", value: "standard" },
      ],
      match: (item, value) => (value === "featured" ? item.isFeatured : !item.isFeatured),
    },
  ];

  const columns: Column<BlogPost>[] = [
    {
      id: "title",
      label: "Title & Slug",
      width: "30%",
      sortable: true,
      sortValue: (post) => post.title,
      searchValue: (post) => post.title,
      render: (post) => (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" component="span" fontWeight={600}>
            {post.title}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            /{post.slug}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "20%",
      render: (post) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={post.isPublished}
            disabled={loadingState?.field === "status" && loadingState?.id === post.id}
            onChange={() => handleToggleStatus(post.id)}
            color="success"
          />

          <Chip
            label={post.isPublished ? "Published" : "Draft"}
            color={post.isPublished ? "success" : "default"}
            size="small"
            variant="outlined"
            sx={{ minWidth: 85, justifyContent: "center" }}
          />
        </Stack>
      ),
    },
    {
      id: "featured",
      label: "Spotlight",
      width: "20%",
      render: (post) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={post.isFeatured}
            disabled={loadingState?.field === "featured" && loadingState?.id === post.id}
            onChange={() => handleToggleFeatured(post.id)}
            color="warning"
          />

          <Chip
            icon={post.isFeatured ? <StarIcon fontSize="small" /> : undefined}
            label={post.isFeatured ? "Featured" : "Standard"}
            color={post.isFeatured ? "warning" : "default"}
            size="small"
            variant="outlined"
            sx={{ minWidth: 105, justifyContent: "center" }}
          />
        </Stack>
      ),
    },
    {
      id: "date",
      label: "Created",
      width: "15%",
      sortable: true,
      sortValue: (post) => new Date(post.createdAt).getTime(),
      render: (post) => (
        <Typography variant="body2">{new Date(post.createdAt).toLocaleDateString()}</Typography>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      width: "15%",
      render: (post) => (
        <Stack direction="row" spacing={0} justifyContent="flex-end">
          {post.isPublished && (
            <Tooltip title="View Public Page">
              <IconButton
                component={Link}
                href={`${env.NEXT_PUBLIC_MARKETING_URL}/blog/${post.slug}`}
                target="_blank"
                size="small"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Edit">
            <IconButton component={Link} href={`/blog/${post.id}`} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => requestDelete(post.id)}>
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
        data={posts}
        columns={columns}
        title="Posts"
        searchPlaceholder="Search posts..."
        filters={filters}
        action={
          <Button
            component={Link}
            href="/blog/create"
            variant="contained"
            startIcon={<AddIcon />}
            size="medium"
          >
            Create Post
          </Button>
        }
        paginated
        emptyMessage="No blog posts yet. Create the first one!"
      />

      <ConfirmationModal
        open={!!deleteId}
        title="Delete Blog Post"
        onClose={cancelDelete}
        type="danger"
        message="Are you sure you want to delete this post?"
        details="This action cannot be undone."
        confirmText="Delete"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  );
};
