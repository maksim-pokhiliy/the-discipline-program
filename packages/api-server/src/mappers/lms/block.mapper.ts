import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type ExerciseEntry as PrismaExerciseEntry,
  type SetGroup as PrismaSetGroup,
} from "@prisma/client";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type SetGroup } from "@repo/contracts/lms/set-group";

import { mapToBlockSegmentWithSetGroups } from "./block-segment.mapper";
import { BLOCK_STATUS_MAP } from "./enum-maps";

type SetGroupWithEntries = PrismaSetGroup & { entries: PrismaExerciseEntry[] };
type BlockSegmentWithSetGroups = PrismaBlockSegment & { setGroups: SetGroupWithEntries[] };

export type BlockWithSegmentsRow = PrismaBlock & { segments: BlockSegmentWithSetGroups[] };

export type BlockWithSegments = Block & {
  segments: (BlockSegment & {
    setGroups: (SetGroup & { entries: ExerciseEntry[] })[];
  })[];
};

export const mapToBlock = (b: PrismaBlock): Block => ({
  id: b.id,
  sessionId: b.sessionId,
  order: b.order,
  kindId: b.kindId,
  title: b.title,
  status: BLOCK_STATUS_MAP[b.status],
  weight: b.weight,
  notes: b.notes,
});

export const mapToBlockWithSegments = (b: BlockWithSegmentsRow): BlockWithSegments => ({
  ...mapToBlock(b),
  segments: b.segments.map(mapToBlockSegmentWithSetGroups),
});
