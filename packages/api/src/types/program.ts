export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}
