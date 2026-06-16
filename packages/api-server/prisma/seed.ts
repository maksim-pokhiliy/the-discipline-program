import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { clearAll } from "./seed/clear-all";
import { seedProfiles } from "./seed/profiles";
import { seedTrainingData } from "./seed/training-data";
import { seedUsers } from "./seed/users";

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed must not run in production");
  }

  console.log("Starting seed...\n");

  await clearAll(prisma);

  const passwordHash = await bcrypt.hash("password12345", AUTH_CONSTANTS.BCRYPT_COST_FACTOR);

  const users = await seedUsers(prisma, passwordHash);

  const { coachProfile } = await seedProfiles(prisma, users);

  await seedTrainingData(prisma, users, coachProfile);

  console.log("\nSeed completed!");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
