import { type ApiClient } from "@repo/api-client";
import type { BlockType } from "@repo/contracts/lms/block-type";
import type { DayType } from "@repo/contracts/lms/day-type";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemeType } from "@repo/contracts/lms/scheme-type";
import { logger } from "@repo/shared";

export type LibraryCatalog = {
  exercises: Exercise[];
  blockTypes: BlockType[];
  schemeTypes: SchemeType[];
  dayTypes: DayType[];
};

const settledOrEmpty = <T>(result: PromiseSettledResult<T[]>, label: string): T[] => {
  if (result.status === "fulfilled") {
    return result.value;
  }

  logger.warn("Library catalog partial failure", {
    catalog: label,
    reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
  });

  return [];
};

export const createLibraryAPI = (client: ApiClient) => ({
  getAll: async (): Promise<LibraryCatalog> => {
    const [exercises, blockTypes, schemeTypes, dayTypes] = await Promise.allSettled([
      client.request<Exercise[]>("/api/platform/library/exercises"),
      client.request<BlockType[]>("/api/platform/library/block-types"),
      client.request<SchemeType[]>("/api/platform/library/scheme-types"),
      client.request<DayType[]>("/api/platform/library/day-types"),
    ]);

    return {
      exercises: settledOrEmpty(exercises, "exercises"),
      blockTypes: settledOrEmpty(blockTypes, "blockTypes"),
      schemeTypes: settledOrEmpty(schemeTypes, "schemeTypes"),
      dayTypes: settledOrEmpty(dayTypes, "dayTypes"),
    };
  },
});
