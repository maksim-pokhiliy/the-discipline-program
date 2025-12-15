"use client";

import { z } from "zod";

export const programFormSchema = z.object({
  name: z.string().min(1, "Program name is required").max(100, "Name is too long"),

  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .max(50, "Slug is too long"),

  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  currency: z.enum(["USD", "EUR", "UAH"]),
  features: z.array(z.string().min(1)).min(1, "At least one feature is required"),
  isActive: z.boolean(),
  sortOrder: z.number().min(0, "Sort order cannot be negative"),
});

export type ProgramFormSchema = z.infer<typeof programFormSchema>;
