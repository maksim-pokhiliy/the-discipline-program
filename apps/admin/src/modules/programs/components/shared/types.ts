import { Program } from "@repo/api";

export type ProgramCurrency = "USD" | "EUR" | "UAH";

export interface ProgramFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: ProgramCurrency;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface ProgramFormProps {
  program?: Program | null;
  onSubmit: (data: ProgramFormData) => void;
  isSubmitting?: boolean;
  formId?: string;
}

export interface ProgramModalProps {
  open: boolean;
  onClose: () => void;
  program?: Program | null;
}
