"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import {
  BLOG_CATEGORIES,
  createBlogPostSchema,
  type CreateBlogPostData,
} from "@repo/contracts/blog";
import { UPLOAD_CONFIG } from "@repo/contracts/upload";
import { ImageUpload } from "@repo/ui";

import { useUploadImage } from "@app/lib/hooks";

import { slugify } from "../utils/helpers";

interface BlogPostFormProps {
  id: string; // <--- ID обязателен для связки с кнопкой в хедере
  defaultValues?: Partial<CreateBlogPostData>;
  onSubmit: (data: CreateBlogPostData) => void;
  isLoading?: boolean;
}

export const BlogPostForm = ({
  id,
  defaultValues,
  onSubmit,
  isLoading = false,
}: BlogPostFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, dirtyFields },
  } = useForm<CreateBlogPostData>({
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
      ...defaultValues,
    },
  });

  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();
  const title = watch("title");

  useEffect(() => {
    if (title && !dirtyFields.slug) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, dirtyFields.slug, setValue]);

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={4} alignItems="flex-start">

        {/* === LEFT COLUMN: MAIN EDITOR === */}
        <Stack spacing={3} flex={1} width="100%">
          <Card>
            <CardContent component={Stack} spacing={3}>
              <TextField
                label="Post Title"
                placeholder="Enter an engaging title..."
                variant="outlined"
                fullWidth
                disabled={isLoading}
                error={!!errors.title}
                helperText={errors.title?.message}
                slotProps={{
                  htmlInput: { sx: { fontSize: "1.25rem", fontWeight: 500 } }
                }}
                {...register("title")}
              />

              <TextField
                label="Slug (URL)"
                fullWidth
                size="small"
                disabled={isLoading}
                error={!!errors.slug}
                helperText={errors.slug?.message || "Unique URL identifier"}
                {...register("slug")}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />

              <Divider />

              <TextField
                label="Excerpt"
                placeholder="Short summary for SEO and previews..."
                fullWidth
                multiline
                minRows={3}
                disabled={isLoading}
                error={!!errors.excerpt}
                helperText={errors.excerpt?.message}
                {...register("excerpt")}
              />

              <TextField
                label="Content (Markdown)"
                placeholder="Write your masterpiece here..."
                fullWidth
                multiline
                minRows={20} // Больше места для текста
                disabled={isLoading}
                error={!!errors.content}
                helperText={errors.content?.message}
                sx={{ fontFamily: "monospace" }}
                {...register("content")}
              />
            </CardContent>
          </Card>
        </Stack>

        {/* === RIGHT COLUMN: SETTINGS & META === */}
        <Stack spacing={3} width={{ xs: "100%", lg: 360 }}>

          {/* 1. Status & Visibility */}
          <Card>
            <CardHeader title="Publishing" titleTypographyProps={{ variant: "h6" }} />
            <Divider />
            <CardContent>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Checkbox {...register("isPublished")} disabled={isLoading} />}
                  label="Published"
                />
                <FormControlLabel
                  control={<Checkbox {...register("isFeatured")} disabled={isLoading} />}
                  label="Featured Post"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* 2. Media */}
          <Card>
            <CardHeader title="Cover Image" titleTypographyProps={{ variant: "h6" }} />
            <Divider />
            <CardContent>
              <Controller
                name="coverImage"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <ImageUpload
                    previewUrl={value}
                    isUploading={isUploading}
                    disabled={isLoading}
                    maxSizeBytes={UPLOAD_CONFIG.blog.maxSize}
                    acceptedTypes={[...UPLOAD_CONFIG.blog.acceptedTypes]}
                    onFileSelect={(file) => {
                      uploadImage(
                        { file, context: "blog" },
                        { onSuccess: (res) => onChange(res.url) }
                      );
                    }}
                    onRemove={() => onChange("")}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* 3. Taxonomy */}
          <Card>
            <CardHeader title="Organization" titleTypographyProps={{ variant: "h6" }} />
            <Divider />
            <CardContent component={Stack} spacing={3}>
              <FormControl fullWidth size="small" error={!!errors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  defaultValue={defaultValues?.category || "Uncategorized"}
                  {...register("category")}
                  disabled={isLoading}
                >
                  <MenuItem value="Uncategorized">Uncategorized</MenuItem>
                  {BLOG_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <FormHelperText>{errors.category.message}</FormHelperText>
                )}
              </FormControl>

              <TextField
                label="Author"
                fullWidth
                size="small"
                disabled={isLoading}
                error={!!errors.authorName}
                helperText={errors.authorName?.message}
                {...register("authorName")}
              />
            </CardContent>
          </Card>
        </Stack>

      </Stack>
    </form>
  );
};
