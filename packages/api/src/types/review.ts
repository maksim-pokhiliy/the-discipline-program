export interface Review {
  id: string;
  text: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
  rating: number;
  programId?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReviewStats {
  total: number;
  active: number;
  featured: number;
}

export interface AdminReviewsPageData {
  stats: ReviewStats;
  reviews: Review[];
}
