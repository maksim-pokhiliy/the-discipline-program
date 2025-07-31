export interface Review {
  id: string;
  text: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  rating: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
}
