import { Gender, HealthStatus, type PrismaClient } from "@prisma/client";

import { daysAgo } from "./_helpers";
import { type SeededUsers } from "./users";

export const seedProfiles = async (db: PrismaClient, users: SeededUsers) => {
  const coachProfile = await db.coachProfile.create({
    data: {
      userId: users.coach.id,
      bio: "CrossFit & Weightlifting coach. Wingate Sport Institute graduate. Adaptive CrossFit specialist. Your DISCIPLINE dictates your SUCCESS.",
      createdAt: daysAgo(60),
    },
  });

  await db.athleteProfile.createMany({
    data: [
      { userId: users.sarah.id, gender: Gender.FEMALE, heightCm: 168, weightKg: 63 },
      { userId: users.mike.id, gender: Gender.MALE, heightCm: 183, weightKg: 88 },
      { userId: users.jenny.id, gender: Gender.FEMALE, heightCm: 160, weightKg: 55 },
      { userId: users.david.id, gender: Gender.MALE, heightCm: 178, weightKg: 82 },
      {
        userId: users.lisa.id,
        gender: Gender.FEMALE,
        heightCm: 172,
        weightKg: 67,
        healthStatus: HealthStatus.RESTRICTED,
        healthNote:
          "Knee — meniscus, post-op week 6. Cleared for upper-only WODs + air bike. No squat, no jumping.",
      },
      { userId: users.tom.id, gender: Gender.MALE, heightCm: 175, weightKg: 78 },
      {
        userId: users.alex.id,
        gender: Gender.MALE,
        heightCm: 190,
        weightKg: 95,
        healthStatus: HealthStatus.INJURED,
        healthNote:
          "Right shoulder. Avoid overhead pressing, kipping, snatch. Cleared for squats + posterior chain. Re-eval in 2 wk.",
      },
      { userId: users.nina.id, gender: Gender.FEMALE, heightCm: 165, weightKg: 58 },
      { userId: users.chris.id, gender: Gender.MALE, heightCm: 180, weightKg: 85 },
      { userId: users.maria.id, gender: Gender.FEMALE, heightCm: 162, weightKg: 56 },
    ],
  });

  const athleteIds = [
    users.sarah.id,
    users.mike.id,
    users.jenny.id,
    users.david.id,
    users.lisa.id,
    users.tom.id,
    users.alex.id,
    users.nina.id,
    users.chris.id,
    users.maria.id,
  ];

  await db.coachAthleteAssignment.createMany({
    data: athleteIds.map((athleteId) => ({ coachId: coachProfile.id, athleteId })),
  });

  console.log("  Profiles: 1 coach, 10 athletes (1 INJURED, 1 RESTRICTED, 8 HEALTHY)");
  console.log("  Coach-athlete assignments: 10");

  return { coachProfile };
};
