"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";
import { AdminBlogPost } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { useBlogMutations } from "@app/lib/hooks";
import { ContentSection } from "@app/shared/components/ui";

import { DeletePostConfirmationModal, PostsTable } from "../../components";
import { createDuplicateBlogPost } from "../../utils";

interface BlogTableSectionProps {
  posts: AdminBlogPost[];
}

export const PostsTableSection = ({ posts }: BlogTableSectionProps) => {
  const postModal = useModal();
  const deletePostModal = useModal();

  const { deletePost } = useBlogMutations();

  const [selectedPost, setSelectedPost] = useState<AdminBlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<AdminBlogPost | null>(null);

  const handleCreatePost = () => {
    setSelectedPost(null);
    postModal.open();
  };

  const handleEditPost = (post: AdminBlogPost) => {
    setSelectedPost(post);
    postModal.open();
  };

  const handleDuplicatePost = (post: AdminBlogPost) => {
    const duplicateData = createDuplicateBlogPost(post, posts);

    setSelectedPost({
      ...duplicateData,
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    postModal.open();
  };

  const handleDeleteClick = (post: AdminBlogPost) => {
    setPostToDelete(post);
    deletePostModal.open();
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) {
      return;
    }

    try {
      await deletePost.mutateAsync(postToDelete.id);
      deletePostModal.close();
      setPostToDelete(null);
    } catch (error) {
      console.error("Failed to delete blog post:", error);
    }
  };

  return (
    <>
      <ContentSection title="Blog Posts" subtitle="Create, publish, and curate your blog content">
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePost}
              size="small"
            >
              Add New Post
            </Button>
          </Stack>

          <PostsTable
            posts={posts}
            onEditPost={handleEditPost}
            onDuplicatePost={handleDuplicatePost}
            onDeletePost={handleDeleteClick}
          />
        </Stack>
      </ContentSection>

      <DeletePostConfirmationModal
        open={deletePostModal.isOpen}
        onClose={deletePostModal.close}
        post={postToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePost.isPending}
        error={deletePost.error instanceof Error ? deletePost.error.message : null}
      />
    </>
  );
};
