import { OrderStatus } from "@prisma/client";

export interface ContentStats {
  programs: {
    total: number;
    active: number;
    inactive: number;
  };
  reviews: {
    total: number;
    active: number;
    featured: number;
  };
  blogPosts: {
    total: number;
    published: number;
    drafts: number;
    featured: number;
  };
  contactSubmissions: {
    total: number;
    new: number;
    processed: number;
  };
}

export interface BusinessStats {
  revenue: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  orders: {
    total: number;
    completed: number;
    failed: number;
    processing: number;
  };
  averageOrderValue: number;
  conversionRate: number;
  topPrograms: Array<{
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    programName: string;
    amount: number;
    currency: string;
    customerEmail: string;
    status: OrderStatus;
    createdAt: string;
  }>;
}

export interface DashboardData {
  contentStats: ContentStats;
  businessStats: BusinessStats;
}
