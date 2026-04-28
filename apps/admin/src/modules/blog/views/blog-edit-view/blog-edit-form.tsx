"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  createBlogPostSchema,
  type BlogPost,
  type CreateBlogPostData,
} from "@repo/contracts/cms/blog";
import { FormView } from "@repo/ui";

import { useUpdateBlogPost } from "@app/lib/hooks";

import { BlogPostForm } from "../../components";

type CreateBlogPostInput = z.input<typeof createBlogPostSchema>;

type BlogEditFormProps = {
  post: BlogPost;
};

export const BlogEditForm: React.FC<BlogEditFormProps> = ({ post }) => {
  const { mutate: updatePost, isPending } = useUpdateBlogPost();

  const methods = useForm<CreateBlogPostInput, unknown, CreateBlogPostData>({
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
