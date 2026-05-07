import { type PrismaClient, type TrainingPlan, TrainingPlanStatus } from "@prisma/client";

import { daysAgo } from "./_helpers";

export type SeededPlans = {
  competitor: TrainingPlan;
  foundations: TrainingPlan;
  olympic: TrainingPlan;
  archived: TrainingPlan;
};

export const seedTrainingPlans = async (
  db: PrismaClient,
  coachUserId: string,
): Promise<SeededPlans> => {
  const competitor = await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "The Competitor",
      description:
        "12-week periodized program targeting CrossFit Open qualification. Strength, gymnastics, and conditioning.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(30),
    },
  });

  const foundations = await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "Foundations GPP",
      description:
        "General physical preparedness for athletes new to structured programming. Build a broad base.",
      status: TrainingPlanStatus.ACTIVE,
      createdAt: daysAgo(21),
    },
  });

  const olympic = await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "Olympic Lifting Focus",
      description: "6-week snatch and clean & jerk peaking cycle.",
      status: TrainingPlanStatus.DRAFT,
      createdAt: daysAgo(3),
    },
  });

  const archived = await db.trainingPlan.create({
    data: {
      creatorId: coachUserId,
      name: "2025 Open Prep",
      description: "Archived program from last year's Open preparation cycle.",
      status: TrainingPlanStatus.ARCHIVED,
      createdAt: daysAgo(120),
    },
  });

  console.log(`  Training plans: 4 (2 active, 1 draft, 1 archived)`);

  return { competitor, foundations, olympic, archived };
};
