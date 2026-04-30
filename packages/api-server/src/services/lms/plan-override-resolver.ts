import { type Prisma, type PrismaClient } from "@prisma/client";

import { planOverridePayloadSchema, PlanOverrideKind } from "@repo/contracts/lms/plan-override";
import type { EffectivePlanWeek } from "@repo/contracts/lms/plan-override";
import { NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

import {
  mapToBlock,
  mapToBlockSegment,
  mapToExerciseEntry,
  mapToLmsSession,
} from "../../mappers/lms";

type Db = PrismaClient | Prisma.TransactionClient;

export interface ResolveEffectivePlanInput {
  db: Db;
  enrollmentId: string;
  weekIndex: number;
}

type EffectiveNode = {
  isOverridden: boolean;
  overrideKind: PlanOverrideKind | null;
  notes: string[];
  suspended: boolean;
};

const baseNode = (): EffectiveNode => ({
  isOverridden: false,
  overrideKind: null,
  notes: [],
  suspended: false,
});

export const resolveEffectivePlan = async ({
  db,
  enrollmentId,
  weekIndex,
}: ResolveEffectivePlanInput): Promise<EffectivePlanWeek> => {
  const enrollment = await db.planEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      plan: {
        include: {
          weeks: {
            where: { index: weekIndex },
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
                                include: { entries: true },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new NotFoundError("Enrollment not found", { enrollmentId });
  }

  const week = enrollment.plan.weeks[0];

  if (!week) {
    throw new NotFoundError("Week not found at index", { enrollmentId, weekIndex });
  }

  const overrides = await db.planOverride.findMany({
    where: {
      enrollmentId,
      OR: [
        { startsOnWeekIndex: null, endsOnWeekIndex: null },
        {
          startsOnWeekIndex: { lte: weekIndex },
          endsOnWeekIndex: { gte: weekIndex },
        },
        { startsOnWeekIndex: { lte: weekIndex }, endsOnWeekIndex: null },
        { startsOnWeekIndex: null, endsOnWeekIndex: { gte: weekIndex } },
      ],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const countByKind: Record<string, number> = {};

  const applyOverride = (
    node: EffectiveNode,
    overrideId: string,
    kind: string,
    payload: unknown,
  ): void => {
    if (node.suspended) {
      return;
    }

    const parsed = planOverridePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return;
    }

    const data = parsed.data;

    switch (data.kind) {
      case "REPLACE": {
        node.isOverridden = true;
        node.overrideKind = PlanOverrideKind.REPLACE;
        countByKind["REPLACE"] = (countByKind["REPLACE"] ?? 0) + 1;
        break;
      }
      case "APPEND": {
        node.isOverridden = true;
        node.overrideKind = PlanOverrideKind.APPEND;
        countByKind["APPEND"] = (countByKind["APPEND"] ?? 0) + 1;
        break;
      }
      case "SUSPEND": {
        node.isOverridden = true;
        node.overrideKind = PlanOverrideKind.SUSPEND;
        node.suspended = true;
        countByKind["SUSPEND"] = (countByKind["SUSPEND"] ?? 0) + 1;
        break;
      }
      case "NOTE": {
        node.isOverridden = true;
        node.overrideKind = PlanOverrideKind.NOTE;
        node.notes = [...node.notes, data.markdown];
        countByKind["NOTE"] = (countByKind["NOTE"] ?? 0) + 1;
        break;
      }
      default: {
        void (data satisfies never);
        logger.warn("lms.plan_override.unknown_kind", { overrideId, kind });
        break;
      }
    }
  };

  const nodeMap = new Map<string, EffectiveNode>();

  const getNode = (id: string): EffectiveNode => {
    const existing = nodeMap.get(id);

    if (existing) {
      return existing;
    }

    const node = baseNode();

    nodeMap.set(id, node);

    return node;
  };

  for (const override of overrides) {
    const node = getNode(override.scopeId);

    applyOverride(node, override.id, override.kind, override.payload);
  }

  const getAppendedEntries = (scopeId: string, baseEntriesCount: number) =>
    overrides
      .filter((o) => o.scopeId === scopeId)
      .flatMap((o) => {
        const parsed = planOverridePayloadSchema.safeParse(o.payload);

        if (parsed.success && parsed.data.kind === "APPEND") {
          return parsed.data.entries.map((entry, idx) => ({
            ...baseNode(),
            id: entry.id,
            order: baseEntriesCount + idx,
          }));
        }

        return [];
      });

  const effectiveWeek: EffectivePlanWeek = {
    ...baseNode(),
    id: week.id,
    index: week.index,
    days: week.days.map((day) => {
      const dayNode = getNode(day.id);

      return {
        ...dayNode,
        id: day.id,
        sessions: day.sessions.map((session) => {
          const sessionNode = getNode(session.id);
          const mappedSession = mapToLmsSession(session);

          return {
            ...sessionNode,
            id: session.id,
            order: mappedSession.order,
            blocks: session.blocks.map((block) => {
              const blockNode = getNode(block.id);
              const mappedBlock = mapToBlock(block);

              const effectiveSegments = block.segments.map((segment) => {
                const segmentNode = getNode(segment.id);
                const mappedSegment = mapToBlockSegment(segment);

                const allEntries = segment.setGroups.flatMap((sg) => sg.entries);

                const baseEntries = allEntries.map((entry) => {
                  const entryNode = getNode(entry.id);
                  const mapped = mapToExerciseEntry(entry);

                  return {
                    ...entryNode,
                    id: entry.id,
                    order: mapped.order,
                  };
                });

                const appendedEntries = getAppendedEntries(segment.id, allEntries.length);

                return {
                  ...segmentNode,
                  id: segment.id,
                  order: mappedSegment.order,
                  entries: [...baseEntries, ...appendedEntries],
                };
              });

              return {
                ...blockNode,
                id: block.id,
                order: mappedBlock.order,
                segments: effectiveSegments,
              };
            }),
          };
        }),
      };
    }),
  };

  logger.info("lms.plan_override.resolved", {
    enrollmentId,
    weekIndex,
    overrideCount: overrides.length,
    applied: countByKind,
  });

  return effectiveWeek;
};
