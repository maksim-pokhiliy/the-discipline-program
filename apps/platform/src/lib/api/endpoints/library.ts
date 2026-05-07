import { type ApiClient } from "@repo/api-client";
import type { BlockType } from "@repo/contracts/lms/block-type";
import type { DayType } from "@repo/contracts/lms/day-type";
import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemeType } from "@repo/contracts/lms/scheme-type";

export type LibraryCatalog = {
  exercises: Exercise[];
  blockTypes: BlockType[];
  schemeTypes: SchemeType[];
  dayTypes: DayType[];
};

export const createLibraryAPI = (client: ApiClient) => ({
  getAll: async (): Promise<LibraryCatalog> => {
    const [exercises, blockTypes, schemeTypes, dayTypes] = await Promise.all([
      client.request<Exercise[]>("/api/platform/library/exercises"),
      client.request<BlockType[]>("/api/platform/library/block-types"),
      client.request<SchemeType[]>("/api/platform/library/scheme-types"),
      client.request<DayType[]>("/api/platform/library/day-types"),
    ]);

    return { exercises, blockTypes, schemeTypes, dayTypes };
  },
});
