"use client";

import { BlogFormInputs } from "./types";

export const FORM_DEFAULTS: BlogFormInputs = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: null,
  author: "",
  category: "",
  tags: [],
  readTime: null,
  isPublished: false,
  isFeatured: false,
  sortOrder: 0,
  publishedAt: null,
};
