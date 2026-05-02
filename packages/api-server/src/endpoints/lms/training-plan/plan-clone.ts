import { Prisma } from "@prisma/client";

import { type TxClient } from "../../../db/tx";
import { toInputJson } from "../../../utils";

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

const buildWeekCreateInput = (week: SourceWeek, targetPlanId: string): Prisma.WeekCreateInput => ({
  plan: { connect: { id: targetPlanId } },
  index: week.index,
  label: week.label,
  notes: week.notes,
  days: {
    create: week.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      kind: day.kind,
      notes: day.notes,
      sessions: {
        create: day.sessions.map((session) => ({
          order: session.order,
          label: session.label,
          notes: session.notes,
          blocks: {
            create: session.blocks.map((block) => ({
              order: block.order,
              kindId: block.kindId,
              title: block.title,
              status: block.status,
              weight: block.weight,
              notes: block.notes,
              version: 1,
              segments: {
                create: block.segments.map((segment) => ({
                  order: segment.order,
                  label: segment.label,
                  archetypeKind: segment.archetypeKind,
                  schemeParams:
                    segment.schemeParams === null ? {} : toInputJson(segment.schemeParams),
                  schemeTemplateId: segment.schemeTemplateId,
                  restConfig:
                    segment.restConfig === null ? Prisma.JsonNull : toInputJson(segment.restConfig),
                  version: 1,
                  setGroups: {
                    create: segment.setGroups.map((setGroup) => ({
                      order: setGroup.order,
                      label: setGroup.label,
                      restConfig:
                        setGroup.restConfig === null
                          ? Prisma.JsonNull
                          : toInputJson(setGroup.restConfig),
                      entries: {
                        create: setGroup.entries.map((entry) => ({
                          order: entry.order,
                          exerciseId: entry.exerciseId,
                          exerciseSnapshot:
                            entry.exerciseSnapshot === null
                              ? {}
                              : toInputJson(entry.exerciseSnapshot),
                          prescription:
                            entry.prescription === null ? {} : toInputJson(entry.prescription),
                          alternatives:
                            entry.alternatives === null ? [] : toInputJson(entry.alternatives),
                          externalUrl: entry.externalUrl,
                          notes: entry.notes,
                          version: 1,
                        })),
                      },
                    })),
                  },
                })),
              },
            })),
          },
        })),
      },
    })),
  },
});

export const cloneWeeksIntoPlan = async (
  tx: TxClient,
  targetPlanId: string,
  weeks: SourceWeek[],
): Promise<void> => {
  for (const week of weeks) {
    await tx.week.create({ data: buildWeekCreateInput(week, targetPlanId) });
  }
};
