"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack } from "@mui/material";
import { AdminBlogPost } from "@repo/api";
import { useModal } from "@repo/ui";
import { useState } from "react";

import { ContentSection } from "@app/shared/components/ui";

import { BlogModal, BlogTable } from "../../components";
import { createDuplicateBlogPost } from "../../utils";

interface BlogTableSectionProps {
  posts: AdminBlogPost[];
}

export const BlogTableSection = ({ posts }: BlogTableSectionProps) => {
  const modal = useModal();
  const [selectedPost, setSelectedPost] = useState<AdminBlogPost | null>(null);

  const handleCreatePost = () => {
    setSelectedPost(null);
    modal.open();
  };

  const handleEditPost = (post: AdminBlogPost) => {
    setSelectedPost(post);
    modal.open();
  };

  const handleDuplicatePost = (post: AdminBlogPost) => {
    const duplicateData = createDuplicateBlogPost(post, posts);

    setSelectedPost({
      ...duplicateData,
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    modal.open();
  };

  const handleCloseModal = () => {
    modal.close();
    setSelectedPost(null);
  };

  return (
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

        <BlogTable
          posts={posts}
          onEditPost={handleEditPost}
          onDuplicatePost={handleDuplicatePost}
        />

        <BlogModal open={modal.isOpen} onClose={handleCloseModal} post={selectedPost} />
      </Stack>
    </ContentSection>
  );
};
