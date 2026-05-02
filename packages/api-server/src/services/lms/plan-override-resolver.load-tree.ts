import { type Prisma, type PlanOverride } from "@prisma/client";

import { NotFoundError } from "@repo/errors";

import { type Db } from "./plan-override-resolver.types";

const enrollmentInclude = {
  plan: {
    include: {
      weeks: {
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
} as const satisfies Prisma.PlanEnrollmentInclude;

export type EnrollmentWithWeek = Prisma.PlanEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

export type WeekWithTree = EnrollmentWithWeek["plan"]["weeks"][number];

export const loadEnrollmentWeek = async (
  db: Db,
  enrollmentId: string,
  weekIndex: number,
): Promise<WeekWithTree> => {
  const enrollment = await db.planEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      plan: {
        include: {
          weeks: {
            where: { index: weekIndex },
            include: enrollmentInclude.plan.include.weeks.include,
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

  return week;
};

export const loadOverridesForWeek = async (
  db: Db,
  enrollmentId: string,
  weekIndex: number,
): Promise<PlanOverride[]> => {
  return db.planOverride.findMany({
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
};
