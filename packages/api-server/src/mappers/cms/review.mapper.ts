import { type MarketingReview } from "@prisma/client";

import { type Review } from "@repo/contracts/cms/review";

export const mapToReview = (r: MarketingReview): Review => ({
  id: r.id,
  authorName: r.authorName,
  authorRole: r.authorRole,
  authorAvatar: r.authorAvatar,
  text: r.text,
  rating: r.rating,
  isActive: r.isActive,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
