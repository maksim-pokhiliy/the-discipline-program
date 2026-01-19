"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import SaveIcon from "@mui/icons-material/Save";
import { FormProvider, useForm } from "react-hook-form";

import { createBlogPostSchema, type BlogPost, type CreateBlogPostData } from "@repo/contracts/blog";
import { ContentSection } from "@repo/ui";

import { useBlogPost, useUpdateBlogPost } from "@app/lib/hooks";

import { BlogPostForm } from "../components/blog-post-form";

interface BlogEditViewProps {
  initialData: BlogPost;
}

export const BlogEditView = ({ initialData }: BlogEditViewProps) => {
  const { data: post } = useBlogPost(initialData.id, initialData);
  const { mutate: updatePost, isPending } = useUpdateBlogPost();

  const methods = useForm<CreateBlogPostData>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      coverImage: post?.coverImage || "",
      authorName: post?.authorName || "",
      category: post?.category || "Uncategorized",
      tags: post?.tags || [],
      isPublished: post?.isPublished || false,
      isFeatured: post?.isFeatured || false,
      readTime: post?.readTime || null,
      publishedAt: post?.publishedAt ? new Date(post.publishedAt) : null,
    },
  });

  const { handleSubmit } = methods;

  if (!post) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <ContentSection
        title="Edit Post"
        subtitle={post.title}
        backgroundColor="dark"
        backHref="/blog"
        backLabel="Back to List"
        actions={[
          {
            label: "Save Changes",
            onClick: handleSubmit((data) => updatePost({ id: post.id, data })),
            loading: isPending,
            startIcon: <SaveIcon />,
          },
        ]}
      >
        <BlogPostForm isLoading={isPending} disableAutoSlug={true} />
      </ContentSection>
    </FormProvider>
  );
};
