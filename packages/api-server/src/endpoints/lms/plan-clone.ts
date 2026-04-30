import { type Prisma } from "@prisma/client";

import { type prisma } from "../../db/client";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type SourceWeek = Prisma.WeekGetPayload<{
  include: {
    days: {
      include: {
        sessions: {
          include: {
            blocks: {
              include: {
                segments: {
                  include: {
                    setGroups: {
                      include: { entries: true };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

export const cloneWeeksIntoPlan = async (
  tx: TxClient,
  targetPlanId: string,
  weeks: SourceWeek[],
): Promise<void> => {
  for (const week of weeks) {
    const newWeek = await tx.week.create({
      data: {
        planId: targetPlanId,
        index: week.index,
        label: week.label,
        notes: week.notes,
      },
    });

    for (const day of week.days) {
      const newDay = await tx.day.create({
        data: {
          weekId: newWeek.id,
          dayOfWeek: day.dayOfWeek,
          kind: day.kind,
          notes: day.notes,
        },
      });

      for (const session of day.sessions) {
        const newSession = await tx.lmsSession.create({
          data: {
            dayId: newDay.id,
            order: session.order,
            label: session.label,
            notes: session.notes,
          },
        });

        for (const block of session.blocks) {
          const newBlock = await tx.block.create({
            data: {
              sessionId: newSession.id,
              order: block.order,
              kindId: block.kindId,
              title: block.title,
              status: block.status,
              weight: block.weight,
              notes: block.notes,
              version: 1,
            },
          });

          for (const segment of block.segments) {
            const newSegment = await tx.blockSegment.create({
              data: {
                blockId: newBlock.id,
                order: segment.order,
                label: segment.label,
                archetypeKind: segment.archetypeKind,
                schemeParams:
                  segment.schemeParams === null
                    ? {}
                    : (segment.schemeParams as Prisma.InputJsonValue),
                schemeTemplateId: segment.schemeTemplateId,
                restConfig:
                  segment.restConfig === null
                    ? undefined
                    : (segment.restConfig as Prisma.InputJsonValue),
                version: 1,
              },
            });

            for (const setGroup of segment.setGroups) {
              const newSetGroup = await tx.setGroup.create({
                data: {
                  segmentId: newSegment.id,
                  order: setGroup.order,
                  label: setGroup.label,
                  restConfig:
                    setGroup.restConfig === null
                      ? undefined
                      : (setGroup.restConfig as Prisma.InputJsonValue),
                },
              });

              for (const entry of setGroup.entries) {
                await tx.exerciseEntry.create({
                  data: {
                    setGroupId: newSetGroup.id,
                    order: entry.order,
                    exerciseId: entry.exerciseId,
                    exerciseSnapshot:
                      entry.exerciseSnapshot === null
                        ? {}
                        : (entry.exerciseSnapshot as Prisma.InputJsonValue),
                    prescription:
                      entry.prescription === null
                        ? {}
                        : (entry.prescription as Prisma.InputJsonValue),
                    alternatives:
                      entry.alternatives === null
                        ? []
                        : (entry.alternatives as Prisma.InputJsonValue),
                    externalUrl: entry.externalUrl,
                    notes: entry.notes,
                    version: 1,
                  },
                });
              }
            }
          }
        }
      }
    }
  }
};
