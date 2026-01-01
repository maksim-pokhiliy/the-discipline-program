import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
