"use client";

import { BlogPost } from "@repo/api";

export interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  author: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface BlogFormProps {
  post?: BlogPost | null;
  onSubmit: (data: BlogFormData) => void;
  isSubmitting?: boolean;
  formId?: string;
}

export interface BlogModalProps {
  open: boolean;
  onClose: () => void;
  post?: BlogPost | null;
  title?: string;
}
