"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createBlogPostSchema, type BlogPost, type CreateBlogPostData } from "@repo/contracts/blog";
import { FormView, QueryWrapper } from "@repo/ui";

import { useBlogPost, useUpdateBlogPost } from "@app/lib/hooks";

import { BlogPostForm } from "../../components";

type BlogEditFormProps = {
  post: BlogPost;
};

const BlogEditForm: React.FC<BlogEditFormProps> = ({ post }) => {
  const { mutate: updatePost, isPending } = useUpdateBlogPost();

  const methods = useForm<CreateBlogPostData>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      coverImage: post.coverImage || "",
      authorName: post.authorName,
      category: post.category,
      tags: post.tags,
      isPublished: post.isPublished,
      isFeatured: post.isFeatured,
      readTime: post.readTime || null,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => updatePost({ id: post.id, data })}
      isPending={isPending}
      title="Edit Post"
      subtitle={post.title}
      backHref="/blog"
      backLabel="Back to List"
    >
      <BlogPostForm isLoading={isPending} disableAutoSlug={true} />
    </FormView>
  );
};

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
