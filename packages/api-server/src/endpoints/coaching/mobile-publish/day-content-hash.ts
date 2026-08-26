import { type LegacyDailyProgram } from "../../../infrastructure/legacy-mobile";
import { contentHash } from "../../../utils";

export type Hashable =
  | { isRestDay: true }
  | { isRestDay: false; dailyProgram: LegacyDailyProgram | null };

export const toHashable = (
  isRestDay: boolean,
  dailyProgram: LegacyDailyProgram | null,
): Hashable => (isRestDay ? { isRestDay: true } : { isRestDay: false, dailyProgram });

export const dayContentHash = (value: Hashable): string => contentHash(value);
