"use client";

import SaveIcon from "@mui/icons-material/Save"; // Иконка для красоты

import { ContentSection } from "@repo/ui";

import { useCreateBlogPost } from "@app/lib/hooks";

import { BlogPostForm } from "../components/blog-post-form";

export const BlogCreateView = () => {
  const { mutate: createPost, isPending } = useCreateBlogPost();
  const FORM_ID = "create-blog-post-form";

  return (
    <ContentSection
      title="Create New Post"
      subtitle="Write and publish a new article"
      backgroundColor="light"
      backHref="/blog"
      backLabel="Back to List"
      actions={[
        {
          label: "Create Post",
          type: "submit",
          form: FORM_ID, // <--- MAGIC: Кнопка здесь, а сабмит там
          loading: isPending,
          startIcon: <SaveIcon />,
        },
      ]}
    >
      <BlogPostForm
        id={FORM_ID} // <--- ID формы
        onSubmit={(data) => createPost(data)}
        isLoading={isPending}
      />
    </ContentSection>
  );
};
