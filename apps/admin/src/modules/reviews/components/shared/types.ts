"use client";

import { Program, Review } from "@repo/api";

export interface ReviewFormData {
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  text: string;
  rating: number;
  programId?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface ReviewFormProps {
  review?: Review | null;
  onSubmit: (data: ReviewFormData) => void;
  isSubmitting?: boolean;
  programs?: Program[];
  formId?: string;
}

export interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  review?: Review | null;
  title?: string;
}
