import { type PrismaClient, Role } from "@prisma/client";

import { at } from "./_helpers";

export const seedUsers = async (db: PrismaClient, passwordHash: string) => {
  const users = await Promise.all([
    db.user.create({
      data: {
        email: "dev-coach@thedisciplineprogram.com",
        name: "Dev Coach",
        role: Role.HEAD_COACH,
        password: passwordHash,
        timezone: "UTC",
      },
    }),
    db.user.create({
      data: {
        email: "dev-admin@thedisciplineprogram.com",
        name: "Dev Admin",
        role: Role.ADMIN,
        password: passwordHash,
        timezone: "UTC",
      },
    }),
  ]);

  console.log("  Users: 2 (1 head coach, 1 admin)");

  return {
    devCoach: at(users, 0),
    devAdmin: at(users, 1),
  };
};

export type SeededUsers = Awaited<ReturnType<typeof seedUsers>>;
