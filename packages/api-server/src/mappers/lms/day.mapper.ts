import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type Day as PrismaDay,
  type ExerciseEntry as PrismaExerciseEntry,
  type LmsSession as PrismaLmsSession,
  type SetGroup as PrismaSetGroup,
} from "@prisma/client";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { type Day } from "@repo/contracts/lms/day";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type LmsSession } from "@repo/contracts/lms/lms-session";
import { type SetGroup } from "@repo/contracts/lms/set-group";

import { DAY_KIND_MAP, DAY_OF_WEEK_MAP } from "./enum-maps";
import { mapToLmsSessionWithBlocks } from "./lms-session.mapper";

type SetGroupWithEntries = PrismaSetGroup & { entries: PrismaExerciseEntry[] };
type BlockSegmentWithSetGroups = PrismaBlockSegment & { setGroups: SetGroupWithEntries[] };
type BlockWithSegments = PrismaBlock & { segments: BlockSegmentWithSetGroups[] };
type LmsSessionWithBlocks = PrismaLmsSession & { blocks: BlockWithSegments[] };

export type DayWithSessionsRow = PrismaDay & { sessions: LmsSessionWithBlocks[] };

export type DayWithSessions = Day & {
  sessions: (LmsSession & {
    blocks: (Block & {
      segments: (BlockSegment & {
        setGroups: (SetGroup & { entries: ExerciseEntry[] })[];
      })[];
    })[];
  })[];
};

export const mapToDay = (d: PrismaDay): Day => ({
  id: d.id,
  weekId: d.weekId,
  dayOfWeek: DAY_OF_WEEK_MAP[d.dayOfWeek],
  kind: DAY_KIND_MAP[d.kind],
  notes: d.notes,
});

export const mapToDayWithSessions = (d: DayWithSessionsRow): DayWithSessions => ({
  ...mapToDay(d),
  sessions: d.sessions.map(mapToLmsSessionWithBlocks),
});
