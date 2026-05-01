import { PlanEnrollmentStatus, type PrismaClient, TrainingPlanStatus } from "@prisma/client";

import { dateOnly, daysAgo, today } from "./_helpers";
import { type SeededUsers } from "./users";

export const seedTrainingPlans = async (
  db: PrismaClient,
  coachUserId: string,
  users: SeededUsers,
): Promise<void> => {
  const activePlan = await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "The Competitor",
      description:
        "12-week periodized program targeting CrossFit Open qualification. Strength, gymnastics, and conditioning.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(30),
    },
  });

  const gppPlan = await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "Foundations GPP",
      description:
        "General physical preparedness for athletes new to structured programming. Build a broad base.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(21),
    },
  });

  await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "Olympic Lifting Focus",
      description: "6-week snatch and clean & jerk peaking cycle.",
      status: TrainingPlanStatus.DRAFT,
      createdAt: daysAgo(3),
    },
  });

  await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "2025 Open Prep",
      description: "Archived program from last year's Open preparation cycle.",
      status: TrainingPlanStatus.ARCHIVED,
      createdAt: daysAgo(120),
    },
  });

  const base = today();

  await db.planEnrollment.createMany({
    data: [
      {
        planId: activePlan.id,
        userId: users.sarah.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(28)),
      },
      {
        planId: activePlan.id,
        userId: users.mike.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(25)),
      },
      {
        planId: activePlan.id,
        userId: users.jenny.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(20)),
      },
      {
        planId: activePlan.id,
        userId: users.alex.id,
        status: PlanEnrollmentStatus.PAUSED,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(15)),
      },
      {
        planId: activePlan.id,
        userId: users.nina.id,
        status: PlanEnrollmentStatus.COMPLETED,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(30)),
        endedOnDate: dateOnly(daysAgo(2)),
      },
      {
        planId: gppPlan.id,
        userId: users.david.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(18)),
      },
      {
        planId: gppPlan.id,
        userId: users.lisa.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(14)),
      },
      {
        planId: gppPlan.id,
        userId: users.tom.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(7)),
      },
      {
        planId: gppPlan.id,
        userId: users.chris.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(5)),
      },
      {
        planId: gppPlan.id,
        userId: users.maria.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startedAtWeekIndex: 0,
        startedOnDate: dateOnly(daysAgo(3)),
      },
    ],
  });

  void base;
  console.log(`  Training plans: 4 (2 active, 1 draft, 1 archived)`);
  console.log(`  Enrollments: 10 (7 active, 1 paused, 1 completed, 1 active in GPP)`);
};
