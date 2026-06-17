import { type Prisma } from "@prisma/client";

const labelSelect = { select: { name: true, rest: true } } as const;

export const timetableInclude = {
  plan: {
    include: {
      weeks: {
        orderBy: { startDate: "asc" },
        include: {
          days: {
            include: {
              label: labelSelect,
              sessions: { orderBy: { order: "asc" }, include: { label: labelSelect } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PlanEnrollmentInclude;

export type TimetableEnrollment = Prisma.PlanEnrollmentGetPayload<{
  include: typeof timetableInclude;
}>;

export type TimetableWeek = TimetableEnrollment["plan"]["weeks"][number];
export type TimetableDay = TimetableWeek["days"][number];
export type TimetableSession = TimetableDay["sessions"][number];
