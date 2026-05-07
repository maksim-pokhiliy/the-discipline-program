import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { seedBlogPosts } from "./seed/blog-posts";
import { clearAll } from "./seed/clear-all";
import { seedCoachNotes } from "./seed/coach-notes";
import { seedContactSubmissions } from "./seed/contact-submissions";
import { seedLibrary } from "./seed/library";
import { seedMarketingPages } from "./seed/marketing-pages";
import { seedPlanContent } from "./seed/plan-content";
import { seedProducts } from "./seed/products";
import { seedProfiles } from "./seed/profiles";
import { seedReviews } from "./seed/reviews";
import { seedTrainingPlans } from "./seed/training-plans";
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

  await seedCoachNotes(prisma, coachProfile.id, users);

  const library = await seedLibrary(prisma);
  const plans = await seedTrainingPlans(prisma, users.coach.id);

  await seedPlanContent(prisma, plans, library);

  await seedMarketingPages(prisma);
  await seedProducts(prisma);
  await seedBlogPosts(prisma);
  await seedReviews(prisma);
  await seedContactSubmissions(prisma);

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
