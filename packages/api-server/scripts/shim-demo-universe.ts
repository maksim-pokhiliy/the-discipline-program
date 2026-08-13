import { type Prisma, type PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { LEGACY_PLAN_INDIVIDUAL } from "../src/endpoints/mobile-compat/legacy-catalogs";

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
const DEMO_LEGACY_PLAN_ID = LEGACY_PLAN_INDIVIDUAL;
const DEMO_LEGACY_LEVEL_ID = 2;
const DEMO_PHONE_NUMBER = "+1-555-0199";
const DEMO_DATE_OF_BIRTH = "1992-03-11";
const CONNECTION_EXPIRES_AT = "2099-01-01";
const DEMO_COACH_BIO = "Synthetic account backing the Appetize compat stand.";
const DEMO_CONNECTION_TOKEN = "shim-demo-stand-has-no-legacy-session";
const DEMO_CONNECTION_LEGACY_USER_ID = "990000";
const TRANSACTION_TIMEOUT_MS = 20_000;

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

const assertCoachIsOurs = async (prisma: PrismaClient, coachId: string | null): Promise<void> => {
  if (coachId === null) {
    return;
  }

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: coachId },
    select: { bio: true, mobileConnections: { select: { legacyUserName: true } } },
  });

  if (profile === null) {
    throw new Error(
      `${DEMO_COACH_EMAIL} exists as a COACH but has no coach profile. This script always ` +
        "creates the pair together, so that row is not ours. Refusing to touch it.",
    );
  }

  if (profile.bio !== DEMO_COACH_BIO) {
    throw new Error(
      `${DEMO_COACH_EMAIL} has a coach profile this script did not stamp (bio does not match ` +
        "the synthetic marker). Refusing to mutate a real coach.",
    );
  }

  const foreign = profile.mobileConnections.find(
    (connection) => connection.legacyUserName !== DEMO_COACH_EMAIL,
  );

  if (foreign !== undefined) {
    throw new Error(
      `${DEMO_COACH_EMAIL} carries a real mobile connection (${foreign.legacyUserName}). ` +
        "Refusing to touch a live legacy session.",
    );
  }
};

const hasLegacyIdentity = async (
  prisma: PrismaClient,
  athleteId: string | null,
): Promise<boolean> => {
  if (athleteId === null) {
    return true;
  }

  const identity = await prisma.mobileLegacyIdentity.findUnique({
    where: { userId: athleteId },
    select: { id: true },
  });

  return identity !== null;
};

const assertAthleteIsOurs = (athleteId: string | null, hasIdentity: boolean): void => {
  if (athleteId !== null && !hasIdentity) {
    throw new Error(
      `${DEMO_ATHLETE_EMAIL} exists but carries no legacy identity. This script always creates ` +
        "the pair together, so that row is not ours. Refusing to overwrite its password.",
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
  const links = await prisma.mobilePublishLink.findMany({
    where: { channel: "INDIVIDUAL", legacyUserId: DEMO_LEGACY_USER_ID },
    select: { planId: true, plan: { select: { creatorId: true, name: true } } },
  });

  if (links.length > 1) {
    throw new Error(
      `${links.length} INDIVIDUAL links carry legacyUserId ${DEMO_LEGACY_USER_ID}. ` +
        "The shim resolves a day across all of them by publishedAt, so the stand would " +
        "serve whichever won last. Reduce them to one by hand before re-seeding.",
    );
  }

  const link = links.at(0);

  if (link === undefined) {
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

type CoachSide = { coachId: string; connectionId: string };

const upsertCoachSide = async (prisma: Prisma.TransactionClient): Promise<CoachSide> => {
  const coach = await prisma.user.upsert({
    where: { email: DEMO_COACH_EMAIL },
    create: { email: DEMO_COACH_EMAIL, name: DEMO_COACH_NAME, role: Role.COACH },
    update: { name: DEMO_COACH_NAME },
    select: { id: true },
  });
  const profile = await prisma.coachProfile.upsert({
    where: { userId: coach.id },
    create: { userId: coach.id, bio: DEMO_COACH_BIO },
    update: {},
    select: { id: true },
  });
  const connection = await prisma.mobileConnection.upsert({
    where: { coachProfileId: profile.id },
    create: {
      coachProfileId: profile.id,
      encryptedToken: DEMO_CONNECTION_TOKEN,
      legacyUserId: DEMO_CONNECTION_LEGACY_USER_ID,
      legacyUserName: DEMO_COACH_EMAIL,
      legacyUserRole: "ADMIN",
      expiresAt: utcMidnight(CONNECTION_EXPIRES_AT),
    },
    update: {},
    select: { id: true },
  });

  return { coachId: coach.id, connectionId: connection.id };
};

const upsertPlan = async (
  prisma: Prisma.TransactionClient,
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

const upsertAthlete = async (
  prisma: Prisma.TransactionClient,
  passwordHash: string,
): Promise<string> => {
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
  await assertCoachIsOurs(prisma, coachRow?.id ?? null);
  assertAthleteIsOurs(
    athleteRow?.id ?? null,
    await hasLegacyIdentity(prisma, athleteRow?.id ?? null),
  );
  await assertLegacyIdentityIsOurs(prisma, athleteRow?.id ?? null);

  const linkedPlanId = await resolveLinkedPlanId(prisma, coachRow?.id ?? null);
  const passwordHash = await bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_COST_FACTOR);

  return prisma.$transaction(
    async (tx) => {
      const coachSide = await upsertCoachSide(tx);
      const planId = await upsertPlan(tx, coachSide.coachId, linkedPlanId);
      const athleteId = await upsertAthlete(tx, passwordHash);
      const link = await tx.mobilePublishLink.upsert({
        where: {
          planId_channel_legacyUserId: {
            planId,
            channel: "INDIVIDUAL",
            legacyUserId: DEMO_LEGACY_USER_ID,
          },
        },
        create: {
          connectionId: coachSide.connectionId,
          planId,
          channel: "INDIVIDUAL",
          legacyUserId: DEMO_LEGACY_USER_ID,
          athleteId,
        },
        update: { connectionId: coachSide.connectionId, athleteId },
        select: { id: true },
      });

      return { planId, athleteId, linkId: link.id };
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );
};
