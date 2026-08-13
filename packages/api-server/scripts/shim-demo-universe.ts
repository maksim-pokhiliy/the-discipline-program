import { type PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { utcMidnight } from "./shim-demo-days";

export const DEMO_COACH_EMAIL = "demo-coach@thedisciplineprogram.com";
export const DEMO_ATHLETE_EMAIL = "demo-athlete@thedisciplineprogram.com";
export const DEMO_PLAN_NAME = "Shim Stand Demo Plan";
export const DEMO_LEGACY_USER_ID = 990001;

const DEMO_COACH_NAME = "Demo Stand Coach";
const DEMO_ATHLETE_NAME = "Demo Athlete";
const DEMO_FIRST_NAME = "Demo";
const DEMO_LAST_NAME = "Athlete";
const DEMO_LEGACY_ROLE_ID = 1;
const DEMO_LEGACY_PLAN_ID = 2;
const DEMO_LEGACY_LEVEL_ID = 2;
const DEMO_PHONE_NUMBER = "+1-555-0199";
const DEMO_DATE_OF_BIRTH = "1992-03-11";
const CONNECTION_EXPIRES_AT = "2099-01-01";

export type DemoUniverse = { planId: string; athleteId: string; linkId: string };

type UserShapeRow = { id: string; role: Role; deletedAt: Date | null };

const assertUserShape = (email: string, row: UserShapeRow | null, expected: Role): void => {
  if (row === null) {
    return;
  }

  if (row.role !== expected) {
    throw new Error(
      `${email} already exists with role ${row.role}, expected ${expected}. ` +
        "Refusing to mutate a row this script did not create.",
    );
  }

  if (row.deletedAt !== null) {
    throw new Error(
      `${email} already exists but is soft-deleted. Restore or purge it by hand before re-seeding.`,
    );
  }
};

const assertLegacyIdentityIsOurs = async (
  prisma: PrismaClient,
  athleteId: string | null,
): Promise<void> => {
  const claimed = await prisma.mobileLegacyIdentity.findUnique({
    where: { legacyUserId: DEMO_LEGACY_USER_ID },
    select: { userId: true },
  });

  if (claimed !== null && claimed.userId !== athleteId) {
    throw new Error(
      `legacyUserId ${DEMO_LEGACY_USER_ID} is claimed by user ${claimed.userId}, ` +
        `which is not ${DEMO_ATHLETE_EMAIL}. Refusing to touch it.`,
    );
  }

  const owned =
    athleteId === null
      ? null
      : await prisma.mobileLegacyIdentity.findUnique({
          where: { userId: athleteId },
          select: { legacyUserId: true },
        });

  if (owned !== null && owned.legacyUserId !== DEMO_LEGACY_USER_ID) {
    throw new Error(
      `${DEMO_ATHLETE_EMAIL} already carries legacyUserId ${owned.legacyUserId}, ` +
        `not ${DEMO_LEGACY_USER_ID}. Refusing to re-key a live identity.`,
    );
  }
};

const resolveLinkedPlanId = async (
  prisma: PrismaClient,
  coachId: string | null,
): Promise<string | null> => {
  const link = await prisma.mobilePublishLink.findFirst({
    where: { channel: "INDIVIDUAL", legacyUserId: DEMO_LEGACY_USER_ID },
    select: { planId: true, plan: { select: { creatorId: true, name: true } } },
  });

  if (link === null) {
    return null;
  }

  if (link.plan.creatorId !== coachId) {
    throw new Error(
      `the INDIVIDUAL link for legacyUserId ${DEMO_LEGACY_USER_ID} points at plan ` +
        `"${link.plan.name}" created by ${link.plan.creatorId}, not by ${DEMO_COACH_EMAIL}. ` +
        "Refusing to publish demo days into someone else's plan.",
    );
  }

  return link.planId;
};

const upsertCoachSide = async (prisma: PrismaClient): Promise<string> => {
  const coach = await prisma.user.upsert({
    where: { email: DEMO_COACH_EMAIL },
    create: { email: DEMO_COACH_EMAIL, name: DEMO_COACH_NAME, role: Role.COACH },
    update: { name: DEMO_COACH_NAME },
    select: { id: true },
  });
  const profile = await prisma.coachProfile.upsert({
    where: { userId: coach.id },
    create: { userId: coach.id, bio: "Synthetic account backing the Appetize compat stand." },
    update: {},
    select: { id: true },
  });
  const connection = await prisma.mobileConnection.upsert({
    where: { coachProfileId: profile.id },
    create: {
      coachProfileId: profile.id,
      encryptedToken: "shim-demo-stand-has-no-legacy-session",
      legacyUserId: String(DEMO_LEGACY_USER_ID),
      legacyUserName: DEMO_COACH_EMAIL,
      legacyUserRole: "ADMIN",
      expiresAt: utcMidnight(CONNECTION_EXPIRES_AT),
    },
    update: { expiresAt: utcMidnight(CONNECTION_EXPIRES_AT) },
    select: { id: true },
  });

  return connection.id;
};

const upsertPlan = async (
  prisma: PrismaClient,
  coachId: string,
  linkedPlanId: string | null,
): Promise<string> => {
  if (linkedPlanId !== null) {
    return linkedPlanId;
  }

  const existing = await prisma.trainingPlan.findFirst({
    where: { creatorId: coachId, name: DEMO_PLAN_NAME, deletedAt: null },
    select: { id: true },
  });

  if (existing !== null) {
    return existing.id;
  }

  const created = await prisma.trainingPlan.create({
    data: {
      creatorId: coachId,
      name: DEMO_PLAN_NAME,
      description: "Synthetic plan backing the Appetize compat stand, not a real athlete plan.",
    },
    select: { id: true },
  });

  return created.id;
};

const upsertAthlete = async (prisma: PrismaClient, password: string): Promise<string> => {
  const passwordHash = await bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_COST_FACTOR);
  const athlete = await prisma.user.upsert({
    where: { email: DEMO_ATHLETE_EMAIL },
    create: {
      email: DEMO_ATHLETE_EMAIL,
      name: DEMO_ATHLETE_NAME,
      role: Role.ATHLETE,
      password: passwordHash,
    },
    update: { name: DEMO_ATHLETE_NAME, password: passwordHash },
    select: { id: true },
  });
  const identity = {
    legacyRoleId: DEMO_LEGACY_ROLE_ID,
    legacyPlanId: DEMO_LEGACY_PLAN_ID,
    legacyLevelId: DEMO_LEGACY_LEVEL_ID,
    isEnabled: true,
    firstName: DEMO_FIRST_NAME,
    lastName: DEMO_LAST_NAME,
    phoneNumber: DEMO_PHONE_NUMBER,
    dateOfBirth: utcMidnight(DEMO_DATE_OF_BIRTH),
  };

  await prisma.mobileLegacyIdentity.upsert({
    where: { userId: athlete.id },
    create: { userId: athlete.id, legacyUserId: DEMO_LEGACY_USER_ID, ...identity },
    update: identity,
  });

  return athlete.id;
};

export const buildDemoUniverse = async (
  prisma: PrismaClient,
  password: string,
): Promise<DemoUniverse> => {
  const [coachRow, athleteRow] = await Promise.all([
    prisma.user.findUnique({
      where: { email: DEMO_COACH_EMAIL },
      select: { id: true, role: true, deletedAt: true },
    }),
    prisma.user.findUnique({
      where: { email: DEMO_ATHLETE_EMAIL },
      select: { id: true, role: true, deletedAt: true },
    }),
  ]);

  assertUserShape(DEMO_COACH_EMAIL, coachRow, Role.COACH);
  assertUserShape(DEMO_ATHLETE_EMAIL, athleteRow, Role.ATHLETE);
  await assertLegacyIdentityIsOurs(prisma, athleteRow?.id ?? null);

  const linkedPlanId = await resolveLinkedPlanId(prisma, coachRow?.id ?? null);
  const connectionId = await upsertCoachSide(prisma);
  const connection = await prisma.mobileConnection.findUniqueOrThrow({
    where: { id: connectionId },
    select: { coachProfile: { select: { userId: true } } },
  });
  const planId = await upsertPlan(prisma, connection.coachProfile.userId, linkedPlanId);
  const athleteId = await upsertAthlete(prisma, password);
  const link = await prisma.mobilePublishLink.upsert({
    where: {
      planId_channel_legacyUserId: {
        planId,
        channel: "INDIVIDUAL",
        legacyUserId: DEMO_LEGACY_USER_ID,
      },
    },
    create: {
      connectionId,
      planId,
      channel: "INDIVIDUAL",
      legacyUserId: DEMO_LEGACY_USER_ID,
      athleteId,
    },
    update: { connectionId, athleteId },
    select: { id: true },
  });

  return { planId, athleteId, linkId: link.id };
};
