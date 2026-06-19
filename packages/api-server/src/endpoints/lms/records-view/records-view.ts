import { type RecordsViewResponse } from "@repo/contracts/lms/records-view";

import { prisma } from "../../../db/client";

import { buildRecordsView } from "./build-records-view";
import { benchmarkRecordSchemaInclude, oneRMRecordExerciseInclude } from "./records-view.types";

export const lmsRecordsViewApi = {
  getRecords: async (userId: string): Promise<RecordsViewResponse> => {
    const oneRMRows = await prisma.oneRMRecord.findMany({
      where: { userId },
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
      include: oneRMRecordExerciseInclude,
    });

    const benchmarkRows = await prisma.benchmarkResult.findMany({
      where: { userId },
      orderBy: [{ recordedAt: "asc" }, { id: "asc" }],
      include: benchmarkRecordSchemaInclude,
    });

    return buildRecordsView({ oneRMRows, benchmarkRows });
  },
};
