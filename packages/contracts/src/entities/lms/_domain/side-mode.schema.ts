import { z } from "zod";

export const sideModeSchema = z.enum([
  "BILATERAL",
  "EACH_ARM",
  "EACH_LEG",
  "ASYMMETRIC_HOLD",
  "UNILATERAL_ALTERNATING",
]);
