"use client";

import { BlogFormData } from "./types";

export const FORM_DEFAULTS: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: null,
  author: "Denis Sergeev",
  category: "Training",
  tags: [],
  isPublished: false,
  isFeatured: false,
  sortOrder: 0,
};

export const BLOG_AUTHORS = ["Denis Sergeev", "Guest Author", "Team TDP"] as const;

export const BLOG_CATEGORIES = [
  "Training",
  "Nutrition",
  "Mindset",
  "Recovery",
  "Competition",
  "CrossFit",
  "Weightlifting",
  "Bodybuilding",
  "General",
] as const;

export const POPULAR_TAGS = [
  "crossfit",
  "training",
  "nutrition",
  "competition",
  "mindset",
  "recovery",
  "weightlifting",
  "bodybuilding",
  "motivation",
  "technique",
  "programming",
  "mobility",
  "strength",
  "endurance",
  "coaching",
] as const;
