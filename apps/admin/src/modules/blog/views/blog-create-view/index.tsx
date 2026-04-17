"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  BlogCategory,
  createBlogPostSchema,
  type CreateBlogPostData,
} from "@repo/contracts/cms/blog";
import { FormView } from "@repo/ui";

import { useCreateBlogPost } from "@app/lib/hooks";

import { BlogPostForm } from "../../components";

type CreateBlogPostInput = z.input<typeof createBlogPostSchema>;

export const BlogCreateView = () => {
  const { mutate: createPost, isPending } = useCreateBlogPost();

  const methods = useForm<CreateBlogPostInput, unknown, CreateBlogPostData>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      authorName: "",
      category: BlogCategory.UNCATEGORIZED,
      tags: [],
      isPublished: false,
      isFeatured: false,
      readTime: null,
      publishedAt: null,
    },
  });

  return (
    <FormView
      methods={methods}
      onSubmit={(data) => createPost(data)}
      isPending={isPending}
      title="Create Post"
      subtitle="New entry"
      backHref="/blog"
      backLabel="Back to List"
      submitLabel="Publish / Save"
    >
      <BlogPostForm isLoading={isPending} />
    </FormView>
  );
};
