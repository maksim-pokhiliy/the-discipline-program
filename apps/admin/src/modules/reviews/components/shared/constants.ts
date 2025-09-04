"use client";

import { ReviewFormData } from "./types";

export const FORM_DEFAULTS: ReviewFormData = {
  authorName: "",
  authorRole: "",
  authorAvatar: "",
  text: "",
  rating: 5,
  programId: "",
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
};

export const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
} as const;
