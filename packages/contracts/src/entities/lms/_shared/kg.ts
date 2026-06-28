import { z } from "zod";

export const ONE_RM_MAX_KG = 9999.99;

const KG_DECIMAL_FACTOR = 100;

const hasAtMostTwoDecimals = (kg: number): boolean =>
  Math.round(kg * KG_DECIMAL_FACTOR) === kg * KG_DECIMAL_FACTOR;

export const kgSchema = z
  .number()
  .finite()
  .positive()
  .max(ONE_RM_MAX_KG)
  .refine(hasAtMostTwoDecimals, { message: "kg must have at most 2 decimal places" });
