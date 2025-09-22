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
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { AdminBlogPost } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useBlogMutations } from "@app/lib/hooks";

import { BlogRow } from "./blog-row";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

interface BlogTableProps {
  posts: AdminBlogPost[];
  onEditPost: (post: AdminBlogPost) => void;
  onDuplicatePost: (post: AdminBlogPost) => void;
}

type SortField = keyof Pick<
  AdminBlogPost,
  "title" | "category" | "sortOrder" | "publishedAt" | "createdAt"
>;
type SortDirection = "asc" | "desc";

export const BlogTable = ({ posts, onEditPost, onDuplicatePost }: BlogTableProps) => {
  const deleteModal = useModal();
  const { deletePost, togglePublished, toggleFeatured, updatePostsOrder } = useBlogMutations();

  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [postToDelete, setPostToDelete] = useState<AdminBlogPost | null>(null);
  const [togglingPublishedId, setTogglingPublishedId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "category":
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case "sortOrder":
        aValue = a.sortOrder;
        bValue = b.sortOrder;
        break;
      case "publishedAt":
        aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
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

  const handleDeleteClick = (post: AdminBlogPost) => {
    setPostToDelete(post);
    deleteModal.open();
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await deletePost.mutateAsync(postToDelete.id);
      deleteModal.close();
      setPostToDelete(null);
    } catch (error) {
      console.error("Failed to delete blog post:", error);
    }
  };

  const handleTogglePublished = async (postId: string) => {
    setTogglingPublishedId(postId);

    try {
      await togglePublished.mutateAsync(postId);
    } catch (error) {
      console.error("Failed to toggle publish state:", error);
    } finally {
      setTogglingPublishedId(null);
    }
  };

  const handleToggleFeatured = async (postId: string) => {
    setTogglingFeaturedId(postId);

    try {
      await toggleFeatured.mutateAsync(postId);
    } catch (error) {
      console.error("Failed to toggle featured state:", error);
    } finally {
      setTogglingFeaturedId(null);
    }
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

    const oldIndex = sortedPosts.findIndex((post) => post.id === active.id);
    const newIndex = sortedPosts.findIndex((post) => post.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(sortedPosts, oldIndex, newIndex);

    try {
      await updatePostsOrder.mutateAsync(reordered);
    } catch (error) {
      console.error("Failed to update blog order:", error);
    }
  };

  const isDragEnabled = sortField === "sortOrder" && sortDirection === "asc";

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ overflow: isDragging ? "hidden" : "auto" }}
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
                <TableCell sortDirection={sortField === "title" ? sortDirection : false}>
                  <TableSortLabel
                    active={sortField === "title"}
                    direction={sortField === "title" ? sortDirection : "asc"}
                    onClick={() => handleSort("title")}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortField === "category" ? sortDirection : false}>
                  <TableSortLabel
                    active={sortField === "category"}
                    direction={sortField === "category" ? sortDirection : "asc"}
                    onClick={() => handleSort("category")}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Published</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell sortDirection={sortField === "publishedAt" ? sortDirection : false}>
                  <TableSortLabel
                    active={sortField === "publishedAt"}
                    direction={sortField === "publishedAt" ? sortDirection : "asc"}
                    onClick={() => handleSort("publishedAt")}
                  >
                    Published At
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortField === "sortOrder" ? sortDirection : false}>
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

            <SortableContext
              items={sortedPosts.map((post) => post.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {sortedPosts.map((post) => (
                  <BlogRow
                    key={post.id}
                    post={post}
                    onEdit={() => onEditPost(post)}
                    onDuplicate={() => onDuplicatePost(post)}
                    onDelete={() => handleDeleteClick(post)}
                    onTogglePublished={() => handleTogglePublished(post.id)}
                    onToggleFeatured={() => handleToggleFeatured(post.id)}
                    isTogglingPublished={togglingPublishedId === post.id}
                    isTogglingFeatured={togglingFeaturedId === post.id}
                    isDragDisabled={!isDragEnabled}
                    isDragging={isDragging}
                  />
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </TableContainer>

      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        post={postToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePost.isPending}
        error={deletePost.error instanceof Error ? deletePost.error.message : null}
      />
    </>
  );
};
