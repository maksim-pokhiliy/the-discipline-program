import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

const EMPTY_DB_PASSWORD = "password12345";
const ADMIN_EMAIL = "admin@example.com";
const COACH_EMAIL = "coach@thedisciplineprogram.com";
const ATHLETE_EMAIL = "athlete@thedisciplineprogram.com";

const upsertAuthUsers = async (prisma: PrismaClient): Promise<void> => {
  const passwordHash = await bcrypt.hash(EMPTY_DB_PASSWORD, AUTH_CONSTANTS.BCRYPT_COST_FACTOR);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: passwordHash, role: Role.ADMIN },
    create: {
      email: ADMIN_EMAIL,
      name: "Admin",
      role: Role.ADMIN,
      password: passwordHash,
      timezone: "Europe/Kiev",
    },
  });

  const coachUser = await prisma.user.upsert({
    where: { email: COACH_EMAIL },
    update: { password: passwordHash, role: Role.COACH },
    create: {
      email: COACH_EMAIL,
      name: "Coach",
      role: Role.COACH,
      password: passwordHash,
      timezone: "Europe/Kiev",
    },
  });

  await prisma.coachProfile.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: { userId: coachUser.id },
  });

  await prisma.user.upsert({
    where: { email: ATHLETE_EMAIL },
    update: { password: passwordHash, role: Role.USER },
    create: {
      email: ATHLETE_EMAIL,
      name: "Athlete",
      role: Role.USER,
      password: passwordHash,
      timezone: "Europe/Kiev",
    },
  });
};

const truncateAllTables = async (prisma: PrismaClient): Promise<void> => {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('_prisma_migrations')
  `;

  if (rows.length === 0) {
    return;
  }

  const quoted = rows.map(({ tablename }) => `"${tablename}"`).join(", ");

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
};

export const createEmptyDbAuthUsers = async (dbUrl: string): Promise<void> => {
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  try {
    await truncateAllTables(prisma);
    await upsertAuthUsers(prisma);
  } finally {
    await prisma.$disconnect();
  }
};
