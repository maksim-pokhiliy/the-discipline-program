import { type PrismaClient } from "@prisma/client";

export const clearAll = async (db: PrismaClient): Promise<void> => {
  await db.setLog.deleteMany();
  await db.exerciseLog.deleteMany();
  await db.blockSession.deleteMany();
  await db.workoutSession.deleteMany();
  await db.benchmark.deleteMany();
  await db.personalRecord.deleteMany();
  await db.weeklyVolume.deleteMany();
  await db.coachNote.deleteMany();
  await db.coachActionItem.deleteMany();
  await db.trainingPlan.deleteMany();
  await db.coachAthleteAssignment.deleteMany();
  await db.athleteProfile.deleteMany();
  await db.coachProfile.deleteMany();
  await db.marketingContactSubmission.deleteMany();
  await db.marketingPageSection.deleteMany();
  await db.marketingPage.deleteMany();
  await db.price.deleteMany();
  await db.product.deleteMany();
  await db.marketingBlogPost.deleteMany();
  await db.marketingReview.deleteMany();
  await db.userInviteToken.deleteMany();
  await db.user.deleteMany();
};
