// packages/api/src/types/dashboard.ts
export interface DashboardStats {
  programsCount: number;
  reviewsCount: number;
  blogPostsCount: number;
  totalRevenue: number;
  contactsCount: number;
  ordersCount: number;
}

export interface RecentActivityItem {
  id: string;
  type: "contact" | "order" | "review" | "blog";
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
  amount?: number;
  currency?: string;
  rating?: number;
  href?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivityItem[];
  quickStats: {
    newContactsCount: number;
    pendingOrdersCount: number;
    unpublishedPostsCount: number;
    featuredReviewsCount: number;
  };
}
