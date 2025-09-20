"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { BlogPost } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useBlogMutations } from "@app/lib/hooks";

import { createDuplicatePost } from "../../utils";

import { BlogTableRow } from "./blog-table-row";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

interface BlogTableProps {
  posts: BlogPost[];
  onEditPost: (post: BlogPost) => void;
  onDuplicatePost: (postData: Partial<BlogPost>) => void;
}

type SortField = keyof Pick<BlogPost, "title" | "publishedAt" | "sortOrder" | "createdAt">;
type SortDirection = "asc" | "desc";

export const BlogTable = ({ posts, onEditPost, onDuplicatePost }: BlogTableProps) => {
  const deleteModal = useModal();
  const { deletePost, togglePublish, toggleFeatured, updatePostsOrder } = useBlogMutations();

  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(null);
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

  const sortedPosts = [...posts].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;

    return 0;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setIsDragging(false);

    if (over && active.id !== over.id) {
      const oldIndex = sortedPosts.findIndex((p) => p.id === active.id);
      const newIndex = sortedPosts.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedPosts = arrayMove(sortedPosts, oldIndex, newIndex);

        updatePostsOrder.mutate(reorderedPosts);
      }
    }
  };

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    deleteModal.open();
  };

  const handleDeleteConfirm = () => {
    if (postToDelete) {
      deletePost.mutate(postToDelete.id);
      deleteModal.close();
      setPostToDelete(null);
    }
  };

  const handleTogglePublish = async (postId: string) => {
    setTogglingPublishId(postId);

    try {
      await togglePublish.mutateAsync(postId);
    } finally {
      setTogglingPublishId(null);
    }
  };

  const handleToggleFeatured = async (postId: string) => {
    setTogglingFeaturedId(postId);

    try {
      await toggleFeatured.mutateAsync(postId);
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={() => setIsDragging(true)}
        >
          <SortableContext
            items={sortedPosts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={40} />
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "title"}
                      direction={sortField === "title" ? sortDirection : "asc"}
                      onClick={() => handleSort("title")}
                    >
                      Title & Excerpt
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Category & Tags</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "publishedAt"}
                      direction={sortField === "publishedAt" ? sortDirection : "asc"}
                      onClick={() => handleSort("publishedAt")}
                    >
                      Published
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === "sortOrder"}
                      direction={sortField === "sortOrder" ? sortDirection : "asc"}
                      onClick={() => handleSort("sortOrder")}
                    >
                      Order
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPosts.map((post) => (
                  <BlogTableRow
                    key={post.id}
                    post={post}
                    onEdit={() => onEditPost(post)}
                    onDelete={() => handleDeleteClick(post)}
                    onDuplicate={() => {
                      const duplicatedPost = createDuplicatePost(post, posts);

                      onDuplicatePost(duplicatedPost);
                    }}
                    onTogglePublish={() => handleTogglePublish(post.id)}
                    onToggleFeatured={() => handleToggleFeatured(post.id)}
                    isTogglingPublish={togglingPublishId === post.id}
                    isTogglingFeatured={togglingFeaturedId === post.id}
                    isDragDisabled={sortField !== "sortOrder"}
                    isDragging={isDragging}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>

        {posts.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            No blog posts yet. Create your first post to get started.
          </Box>
        )}
      </TableContainer>

      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        post={postToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePost.isPending}
        error={deletePost.error?.message || null}
      />
    </>
  );
};
