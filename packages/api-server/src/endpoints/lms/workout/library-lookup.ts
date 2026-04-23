import { type TiptapDoc } from "@repo/contracts/common/tiptap-doc";

import { prisma } from "../../../db/client";
import { EXERCISE_STATUS_MAP } from "../../../mappers/library";

import { collectDocRefs } from "./doc-refs";
import { type LibraryLookup } from "./parser-types";

export const loadLibraryLookup = async (doc: TiptapDoc): Promise<LibraryLookup> => {
  const refs = collectDocRefs(doc);

  const blockTypeIds = Array.from(refs.blockTypeIds);
  const schemeIds = Array.from(refs.schemeIds);
  const exerciseIds = Array.from(refs.exerciseIds);

  const [blockTypeRows, schemeRows, exerciseRows] = await Promise.all([
    blockTypeIds.length > 0
      ? prisma.blockType.findMany({
          where: { id: { in: blockTypeIds } },
          select: { id: true },
        })
      : Promise.resolve([]),
    schemeIds.length > 0
      ? prisma.scheme.findMany({
          where: { id: { in: schemeIds } },
          select: { id: true },
        })
      : Promise.resolve([]),
    exerciseIds.length > 0
      ? prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
          select: { id: true, status: true, createdByUserId: true },
        })
      : Promise.resolve([]),
  ]);

  const exercisesById = new Map(
    exerciseRows.map((row) => [
      row.id,
      {
        id: row.id,
        status: EXERCISE_STATUS_MAP[row.status],
        createdByUserId: row.createdByUserId,
      },
    ]),
  );

  return {
    blockTypeIds: new Set(blockTypeRows.map((row) => row.id)),
    schemeIds: new Set(schemeRows.map((row) => row.id)),
    exerciseIds: new Set(exerciseRows.map((row) => row.id)),
    exercisesById,
  };
};
