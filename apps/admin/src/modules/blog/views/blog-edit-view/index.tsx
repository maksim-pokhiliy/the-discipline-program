"use client";

import { QueryWrapper } from "@repo/ui";

import { useBlogPost } from "@app/lib/hooks";

import { BlogEditForm } from "./blog-edit-form";

type BlogEditViewProps = {
  id: string;
};

export const BlogEditView: React.FC<BlogEditViewProps> = ({ id }) => {
  const { data, isLoading, error } = useBlogPost(id);

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading post...">
      {(post) => <BlogEditForm post={post} />}
    </QueryWrapper>
  );
};
