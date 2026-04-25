import { Prisma } from "@prisma/client";

import { tiptapDocSchema, type TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import { type TrainingPlan, TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { resolveCoachId, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToTrainingPlan, TRAINING_PLAN_STATUS_TO_PRISMA_MAP } from "../../../mappers/lms";
import { findOrThrow, handlePrismaError } from "../../../utils";
import { cloneWorkoutTree, remapMentionNodeIds } from "../workout/clone";

const parseStoredContentDoc = (doc: Prisma.JsonValue): TiptapDoc | null => {
  if (doc === null) {
    return null;
  }

  const parsed = tiptapDocSchema.safeParse(doc);

  return parsed.success ? parsed.data : null;
};

export const duplicateTrainingPlan = async (userId: string, id: string): Promise<TrainingPlan> => {
  const coachId = await resolveCoachId(userId);

  await verifyPlanOwnership(id, coachId);

  const source = await findOrThrow(
    prisma.trainingPlan.findUnique({ where: { id }, include: { workouts: true } }),
    "Training plan",
  );

  try {
    const newPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.trainingPlan.create({
        data: {
          coachId,
          name: `Copy of ${source.name}`,
          description: source.description,
          status: TRAINING_PLAN_STATUS_TO_PRISMA_MAP[TrainingPlanStatus.DRAFT],
        },
      });

      if (source.workouts.length === 0) {
        return plan;
      }

      const createdWorkouts = await tx.workout.createManyAndReturn({
        data: source.workouts.map((workout) => ({
          planId: plan.id,
          scheduledDate: workout.scheduledDate,
          title: workout.title,
          description: workout.description,
          contentDoc: workout.contentDoc === null ? Prisma.JsonNull : workout.contentDoc,
          sortOrder: workout.sortOrder,
        })),
      });

      for (let index = 0; index < source.workouts.length; index += 1) {
        const sourceWorkout = source.workouts[index];
        const targetWorkout = createdWorkouts[index];

        if (!sourceWorkout || !targetWorkout) {
          continue;
        }

        const { blockIdMap, sectionIdMap, slotIdMap } = await cloneWorkoutTree({
          sourceWorkoutId: sourceWorkout.id,
          targetWorkoutId: targetWorkout.id,
          tx,
        });

        const sourceDoc = parseStoredContentDoc(sourceWorkout.contentDoc);

        if (
          sourceDoc !== null &&
          (blockIdMap.size > 0 || sectionIdMap.size > 0 || slotIdMap.size > 0)
        ) {
          const remapped = remapMentionNodeIds(sourceDoc, blockIdMap, sectionIdMap, slotIdMap);

          await tx.workout.update({
            where: { id: targetWorkout.id },
            data: { contentDoc: remapped as Prisma.InputJsonValue },
          });
        }
      }

      return plan;
    });

    return mapToTrainingPlan(newPlan);
  } catch (error) {
    return handlePrismaError(error, { entity: "Training plan", field: "name" });
  }
};
