import { type PrismaClient } from "@prisma/client";

export const clearAll = async (db: PrismaClient): Promise<void> => {
  await db.planEnrollment.deleteMany();
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
  await db.label.deleteMany();
  await db.exercise.deleteMany();
  await db.archetype.deleteMany();
};
