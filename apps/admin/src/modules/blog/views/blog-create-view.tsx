"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { createBlogPostSchema, type CreateBlogPostData } from "@repo/contracts/blog";
import { ContentSection } from "@repo/ui";

import { useCreateBlogPost } from "@app/lib/hooks";

import { BlogPostForm } from "../components/blog-post-form";

export const BlogCreateView = () => {
  const { mutate: createPost, isPending } = useCreateBlogPost();

  const methods = useForm<CreateBlogPostData>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      authorName: "",
      category: "Uncategorized",
      tags: [],
      isPublished: false,
      isFeatured: false,
      readTime: null,
      publishedAt: null,
    },
  });

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Create Post"
        subtitle="New entry"
        backgroundColor="light"
        backHref="/blog"
        backLabel="Back to List"
        actions={[
          {
            label: "Publish / Save",
            onClick: handleSubmit((data) => createPost(data)),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <BlogPostForm isLoading={isPending} />
      </ContentSection>
    </FormProvider>
  );
};
