"use client";

import { AdminBlogPost } from "@repo/api";

import type { BlogFormSchema, BlogFormSchemaInput } from "./schema";

export type BlogFormData = BlogFormSchema;
export type BlogFormInputs = BlogFormSchemaInput;

export interface BlogFormProps {
  post?: AdminBlogPost | null;
  onSubmit: (data: BlogFormData) => void;
  isSubmitting?: boolean;
  formId?: string;
}

export interface BlogModalProps {
  open: boolean;
  onClose: () => void;
  post?: AdminBlogPost | null;
  title?: string;
}
