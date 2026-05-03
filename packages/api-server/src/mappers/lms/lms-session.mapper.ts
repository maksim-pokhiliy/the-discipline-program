import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
  type LmsSession as PrismaLmsSession,
  type SetGroup as PrismaSetGroup,
} from "@prisma/client";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type LmsSession } from "@repo/contracts/lms/lms-session";
import { type SetGroup } from "@repo/contracts/lms/set-group";

import { mapToBlockWithSegments } from "./block.mapper";

type SetGroupWithEntries = PrismaSetGroup & { entries: PrismaExerciseEntry[] };
type BlockSegmentWithSetGroups = PrismaBlockSegment & { setGroups: SetGroupWithEntries[] };
type BlockWithSegments = PrismaBlock & { segments: BlockSegmentWithSetGroups[] };

export type LmsSessionWithBlocksRow = PrismaLmsSession & { blocks: BlockWithSegments[] };

export type LmsSessionWithBlocks = LmsSession & {
  blocks: (Block & {
    segments: (BlockSegment & {
      setGroups: (SetGroup & { entries: ExerciseEntry[] })[];
    })[];
  })[];
};

export const mapToLmsSession = (s: PrismaLmsSession): LmsSession => ({
  id: s.id,
  dayId: s.dayId,
  order: s.order,
  label: s.label,
  notes: s.notes,
  version: s.version,
});

export const mapToLmsSessionWithBlocks = (s: LmsSessionWithBlocksRow): LmsSessionWithBlocks => ({
  ...mapToLmsSession(s),
  blocks: s.blocks.map(mapToBlockWithSegments),
});
