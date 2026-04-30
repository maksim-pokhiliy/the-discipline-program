import {
  type Block as PrismaBlock,
  type BlockSegment as PrismaBlockSegment,
  type Day as PrismaDay,
  type ExerciseEntry as PrismaExerciseEntry,
  type LmsSession as PrismaLmsSession,
  type SetGroup as PrismaSetGroup,
  type TrainingPlan as PrismaTrainingPlan,
  type Week as PrismaWeek,
} from "@prisma/client";

import { type Block } from "@repo/contracts/lms/block";
import { type BlockSegment } from "@repo/contracts/lms/block-segment";
import { type Day } from "@repo/contracts/lms/day";
import { type ExerciseEntry } from "@repo/contracts/lms/exercise-entry";
import { type LmsSession } from "@repo/contracts/lms/lms-session";
import { type SetGroup } from "@repo/contracts/lms/set-group";
import { type TrainingPlan } from "@repo/contracts/lms/training-plan";
import { type Week } from "@repo/contracts/lms/week";

import { TRAINING_PLAN_STATUS_MAP } from "./enum-maps";
import { mapToWeekWithDays } from "./week.mapper";

type SetGroupWithEntries = PrismaSetGroup & { entries: PrismaExerciseEntry[] };
type BlockSegmentWithSetGroups = PrismaBlockSegment & { setGroups: SetGroupWithEntries[] };
type BlockWithSegments = PrismaBlock & { segments: BlockSegmentWithSetGroups[] };
type LmsSessionWithBlocks = PrismaLmsSession & { blocks: BlockWithSegments[] };
type DayWithSessions = PrismaDay & { sessions: LmsSessionWithBlocks[] };
type WeekWithDays = PrismaWeek & { days: DayWithSessions[] };

export type TrainingPlanWithWeeksRow = PrismaTrainingPlan & { weeks: WeekWithDays[] };

export type WeekWithDaysContract = Week & {
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

export type TrainingPlanWithWeeks = TrainingPlan & { weeks: WeekWithDaysContract[] };

export const mapToTrainingPlan = (p: PrismaTrainingPlan): TrainingPlan => ({
  id: p.id,
  creatorId: p.creatorId,
  name: p.name,
  description: p.description,
  status: TRAINING_PLAN_STATUS_MAP[p.status],
  licensable: p.licensable,
  originalPlanId: p.originalPlanId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export const mapToTrainingPlanWithWeeks = (p: TrainingPlanWithWeeksRow): TrainingPlanWithWeeks => ({
  ...mapToTrainingPlan(p),
  weeks: p.weeks.map(mapToWeekWithDays),
});
