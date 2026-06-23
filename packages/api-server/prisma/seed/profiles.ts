import { type PrismaClient } from "@prisma/client";

import { type SeededUsers } from "./users";

export const seedProfiles = async (db: PrismaClient, users: SeededUsers) => {
  const coachProfile = await db.coachProfile.create({
    data: {
      userId: users.devCoach.id,
    },
  });

  console.log("  Profiles: 1 coach");

  return { coachProfile };
};
