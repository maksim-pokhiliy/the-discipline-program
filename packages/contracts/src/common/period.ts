import { z } from "zod";

export enum PeriodUnit {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export const PERIOD_CONSTANTS = {
  MIN_COUNT: 1,
  MAX_COUNT: 365,
} as const;

export const periodSchema = z.object({
  periodCount: z.number().int().min(PERIOD_CONSTANTS.MIN_COUNT).max(PERIOD_CONSTANTS.MAX_COUNT),
  periodUnit: z.nativeEnum(PeriodUnit),
});

export type Period = z.infer<typeof periodSchema>;

export const PERIOD_UNIT_LABELS: Record<PeriodUnit, string> = {
  [PeriodUnit.DAY]: "days",
  [PeriodUnit.WEEK]: "weeks",
  [PeriodUnit.MONTH]: "months",
  [PeriodUnit.YEAR]: "years",
};
