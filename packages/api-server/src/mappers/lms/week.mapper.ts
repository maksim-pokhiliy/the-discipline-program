import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type Day as PrismaDay,
  type ExerciseEntry as PrismaExerciseEntry,
  type LmsSession as PrismaLmsSession,
  type SetGroup as PrismaSetGroup,
  type Week as PrismaWeek,
} from "@prisma/client";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { type Day } from "@repo/contracts/lms/day";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type LmsSession } from "@repo/contracts/lms/lms-session";
import { type SetGroup } from "@repo/contracts/lms/set-group";
import { type Week } from "@repo/contracts/lms/week";

import { mapToDayWithSessions } from "./day.mapper";

type SetGroupWithEntries = PrismaSetGroup & { entries: PrismaExerciseEntry[] };
type BlockSegmentWithSetGroups = PrismaBlockSegment & { setGroups: SetGroupWithEntries[] };
type BlockWithSegments = PrismaBlock & { segments: BlockSegmentWithSetGroups[] };
type LmsSessionWithBlocks = PrismaLmsSession & { blocks: BlockWithSegments[] };
type DayWithSessions = PrismaDay & { sessions: LmsSessionWithBlocks[] };

export type WeekWithDaysRow = PrismaWeek & { days: DayWithSessions[] };

export type WeekWithDays = Week & {
  days: (Day & {
    sessions: (LmsSession & {
      blocks: (Block & {
        segments: (BlockSegment & {
          setGroups: (SetGroup & { entries: ExerciseEntry[] })[];
        })[];
      })[];
    })[];
  })[];
};

export const mapToWeek = (w: PrismaWeek): Week => ({
  id: w.id,
  planId: w.planId,
  index: w.index,
  label: w.label,
  notes: w.notes,
  version: w.version,
});

export const mapToWeekWithDays = (w: WeekWithDaysRow): WeekWithDays => ({
  ...mapToWeek(w),
  days: w.days.map(mapToDayWithSessions),
});
