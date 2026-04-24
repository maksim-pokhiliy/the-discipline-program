import { Prisma } from "@prisma/client";

import { type TiptapDoc, tiptapDocSchema } from "@repo/contracts/common/tiptap-doc";
import { type Workout } from "@repo/contracts/lms/workout";
import { AppError } from "@repo/errors";

import { resolveCoachId, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToWorkout } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";

import { cloneWorkoutTree, remapMentionNodeIds } from "./clone";

const cloneDocForCopy = (doc: Prisma.JsonValue): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  doc === null ? Prisma.JsonNull : (doc as Prisma.InputJsonValue);

const parseStoredContentDoc = (doc: Prisma.JsonValue): TiptapDoc | null => {
  if (doc === null) {
    return null;
  }

  const parsed = tiptapDocSchema.safeParse(doc);

  return parsed.success ? parsed.data : null;
};

const toUTCMidnight = (date: Date): Date => {
  const hours = date.getUTCHours();
  const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (hours >= 12) {
    base.setUTCDate(base.getUTCDate() + 1);
  }

  return base;
};

export const copyWorkoutWeek = async (
  userId: string,
  planId: string,
  sourceDate: Date,
  targetDate: Date,
): Promise<Workout[]> => {
  const coachId = await resolveCoachId(userId);

  await verifyPlanOwnership(planId, coachId);

  const normalizedSource = toUTCMidnight(sourceDate);
  const normalizedTarget = toUTCMidnight(targetDate);

  const sourceEnd = new Date(normalizedSource);

  sourceEnd.setUTCDate(sourceEnd.getUTCDate() + 7);

  const sourceWorkouts = await prisma.workout.findMany({
    where: {
      planId,
      scheduledDate: { gte: normalizedSource, lt: sourceEnd },
    },
    orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (sourceWorkouts.length === 0) {
    return [];
  }

  const dayShiftMs = normalizedTarget.getTime() - normalizedSource.getTime();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const rows = await tx.workout.createManyAndReturn({
        data: sourceWorkouts.map((workout) => ({
          planId,
          scheduledDate: workout.scheduledDate
            ? toUTCMidnight(new Date(workout.scheduledDate.getTime() + dayShiftMs))
            : null,
          title: workout.title,
          description: workout.description,
          contentDoc: cloneDocForCopy(workout.contentDoc),
          sortOrder: workout.sortOrder,
        })),
      });

      for (let index = 0; index < sourceWorkouts.length; index += 1) {
        const source = sourceWorkouts[index];
        const target = rows[index];

        if (!source || !target) {
          continue;
        }

        const { blockIdMap, slotIdMap } = await cloneWorkoutTree({
          sourceWorkoutId: source.id,
          targetWorkoutId: target.id,
          tx,
        });

        const sourceDoc = parseStoredContentDoc(source.contentDoc);

        if (sourceDoc !== null && (blockIdMap.size > 0 || slotIdMap.size > 0)) {
          const remapped = remapMentionNodeIds(sourceDoc, blockIdMap, slotIdMap);

          await tx.workout.update({
            where: { id: target.id },
            data: { contentDoc: remapped as Prisma.InputJsonValue },
          });
        }
      }

      const targetStart = normalizedTarget;
      const targetEnd = new Date(normalizedTarget);

      targetEnd.setUTCDate(targetEnd.getUTCDate() + 7);

      const targetWorkouts = await tx.workout.findMany({
        where: {
          planId,
          scheduledDate: { gte: targetStart, lt: targetEnd },
        },
        orderBy: [{ scheduledDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      });

      let currentDateKey = "";
      let currentIndex = 0;

      for (const target of targetWorkouts) {
        const dateKey = target.scheduledDate?.toISOString() ?? "null";

        if (dateKey !== currentDateKey) {
          currentDateKey = dateKey;
          currentIndex = 0;
        }

        if (target.sortOrder !== currentIndex) {
          await tx.workout.update({
            where: { id: target.id },
            data: { sortOrder: currentIndex },
          });
        }

        currentIndex += 1;
      }

      return rows;
    });

    const refreshed = await prisma.workout.findMany({
      where: { id: { in: created.map((w) => w.id) } },
    });

    return refreshed
      .sort((a, b) => {
        const aDate = a.scheduledDate?.getTime() ?? Number.POSITIVE_INFINITY;
        const bDate = b.scheduledDate?.getTime() ?? Number.POSITIVE_INFINITY;

        if (aDate !== bDate) {
          return aDate - bDate;
        }

        return a.sortOrder - b.sortOrder;
      })
      .map(mapToWorkout);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    return handlePrismaError(error, { entity: "Workout" });
  }
};
