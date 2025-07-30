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

export interface ProgramStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CreateProgramData {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateProgramData extends Partial<CreateProgramData> {
  id: string;
}

export interface AdminProgramsPageData {
  stats: ProgramStats;
  programs: Program[];
}
