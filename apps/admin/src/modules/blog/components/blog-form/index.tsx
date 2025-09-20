"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Divider, Paper, Stack, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useBlogs } from "@app/lib/hooks";

import { BlogFormData, BlogFormProps, blogFormSchema, FORM_DEFAULTS } from "../../shared";
import { generateUniqueSlug } from "../../utils";

import { BasicFields, ContentField, MediaField, SettingsField, TagsField } from "./fields";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

export const BlogForm = ({
  post,
  onSubmit,
  isSubmitting = false,
  formId = "blog-form",
}: BlogFormProps) => {
  const { data: allPosts = [] } = useBlogs();
  const [activeTab, setActiveTab] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: post
      ? {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: post.author,
          category: post.category,
          tags: post.tags,
          isPublished: post.isPublished,
          isFeatured: post.isFeatured,
          sortOrder: post.sortOrder,
        }
      : FORM_DEFAULTS,
  });

  const title = watch("title");

  const handleSlugGenerate = () => {
    if (title) {
      const filteredPosts = post ? allPosts.filter((p) => p.id !== post.id) : allPosts;

      const newSlug = generateUniqueSlug(title, filteredPosts);

      setValue("slug", newSlug);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Paper component="form" id={formId} onSubmit={handleSubmit(onSubmit)} sx={{ p: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Content" />
        <Tab label="Media & Tags" />
        <Tab label="Settings" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Stack spacing={3}>
          <BasicFields
            control={control}
            errors={errors}
            isSubmitting={isSubmitting}
            onSlugGenerate={handleSlugGenerate}
          />
          <Divider />
          <ContentField control={control} errors={errors} isSubmitting={isSubmitting} />
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Stack spacing={3}>
          <MediaField control={control} errors={errors} isSubmitting={isSubmitting} />
          <Divider />
          <TagsField control={control} errors={errors} isSubmitting={isSubmitting} />
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <SettingsField control={control} errors={errors} isSubmitting={isSubmitting} />
      </TabPanel>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {post ? "Update Post" : "Create Post"}
        </Button>
      </Box>
    </Paper>
  );
};
