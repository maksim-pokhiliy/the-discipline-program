"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AdminBlogPost } from "@repo/api";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  BlogFormData,
  BlogFormInputs,
  FORM_DEFAULTS,
  blogFormSchema,
} from "@app/modules/blog/shared";
import { useSlugGeneration } from "@app/shared/hooks/use-slug-generation";

const formatDateForInput = (date: Date | null): string | null => {
  if (!date) {
    return null;
  }

  const isoString = new Date(date).toISOString();

  return isoString.slice(0, 16);
};

interface UseBlogFormProps {
  post?: AdminBlogPost | null;
  onSubmit: (data: BlogFormData) => void;
  isSubmitting?: boolean;
}

export const useBlogForm = ({ post, onSubmit, isSubmitting }: UseBlogFormProps) => {
  const form = useForm<BlogFormInputs, unknown, BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: (post
      ? {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: post.author,
          category: post.category,
          tags: post.tags ?? [],
          readTime: post.readTime,
          isPublished: post.isPublished,
          isFeatured: post.isFeatured,
          sortOrder: post.sortOrder,
          publishedAt: formatDateForInput(post.publishedAt),
        }
      : FORM_DEFAULTS) satisfies BlogFormInputs,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedTitle = watch("title");
  const slugGeneration = useSlugGeneration(watchedTitle);

  useEffect(() => {
    const autoSlug = slugGeneration.getAutoSlug();

    if (autoSlug) {
      setValue("slug", autoSlug);
    }
  }, [watchedTitle, slugGeneration, setValue]);

  const handleSlugChange = (value: string) => {
    slugGeneration.handleSlugManualChange();

    return value;
  };

  const handleTagsChange = (tags: string[]) => {
    setValue("tags", tags.map((tag) => tag.trim()).filter(Boolean));
  };

  const handleCoverChange = (url: string | null) => {
    setValue("coverImage", url);
  };

  const handlePublishedAtChange = (value: string | null) => {
    setValue("publishedAt", value && value.trim() !== "" ? value : null);
  };

  const submitHandler = (data: BlogFormData) => {
    const normalized: BlogFormData = {
      ...data,
      slug: data.slug.trim(),
      coverImage: data.coverImage ? data.coverImage.trim() : null,
      tags: data.tags.map((tag) => tag.trim()).filter(Boolean),
      publishedAt: data.publishedAt && data.publishedAt.trim() !== "" ? data.publishedAt : null,
    };

    onSubmit(normalized);
  };

  return {
    control,
    errors,
    handleSubmit: handleSubmit(submitHandler),
    isSubmitting: Boolean(isSubmitting),
    slugGeneration,
    handleSlugChange,
    handleTagsChange,
    handleCoverChange,
    handlePublishedAtChange,
  };
};
