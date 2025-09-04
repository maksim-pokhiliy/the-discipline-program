"use client";

import { Review } from "@repo/api";

export const createDuplicateReview = (
  originalReview: Review,
  reviews: Review[],
): Omit<Review, "id" | "createdAt" | "updatedAt"> => {
  const maxSortOrder = Math.max(...reviews.map((r) => r.sortOrder), 0);

  return {
    authorName: `${originalReview.authorName} (Copy)`,
    authorRole: originalReview.authorRole,
    authorAvatar: originalReview.authorAvatar,
    text: originalReview.text,
    rating: originalReview.rating,
    programId: originalReview.programId,
    isActive: false,
    isFeatured: false,
    sortOrder: maxSortOrder + 1,
  };
};
