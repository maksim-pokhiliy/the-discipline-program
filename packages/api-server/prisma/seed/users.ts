import { type PrismaClient, Role } from "@prisma/client";

import { at, daysAgo } from "./_helpers";

export const seedUsers = async (db: PrismaClient, passwordHash: string) => {
  const users = await Promise.all([
    db.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin",
        role: Role.ADMIN,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(90),
      },
    }),
    db.user.create({
      data: {
        email: "coach@thedisciplineprogram.com",
        name: "Denys Linetskyi",
        role: Role.COACH,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(60),
      },
    }),
    db.user.create({
      data: {
        email: "head-coach@thedisciplineprogram.com",
        name: "Anna Holovna",
        role: Role.HEAD_COACH,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(75),
      },
    }),
    db.user.create({
      data: {
        email: "sarah.mitchell@email.com",
        name: "Sarah Mitchell",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(55),
      },
    }),
    db.user.create({
      data: {
        email: "mike.thompson@email.com",
        name: "Mike Thompson",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(48),
      },
    }),
    db.user.create({
      data: {
        email: "jenny.park@email.com",
        name: "Jenny Park",
        image:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(34),
      },
    }),
    db.user.create({
      data: {
        email: "david.rodriguez@email.com",
        name: "David Rodriguez",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(4),
      },
    }),
    db.user.create({
      data: {
        email: "lisa.anderson@email.com",
        name: "Lisa Anderson",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(30),
      },
    }),
    db.user.create({
      data: {
        email: "tom.bradley@email.com",
        name: "Tom Bradley",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(2),
      },
    }),
    db.user.create({
      data: {
        email: "alex.kovac@email.com",
        name: "Alex Kovac",
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(40),
      },
    }),
    db.user.create({
      data: {
        email: "nina.reyes@email.com",
        name: "Nina Reyes",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(30),
      },
    }),
    db.user.create({
      data: {
        email: "chris.walker@email.com",
        name: "Chris Walker",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(1),
      },
    }),
    db.user.create({
      data: {
        email: "maria.santos@email.com",
        name: "Maria Santos",
        role: Role.ATHLETE,
        password: passwordHash,
        timezone: "UTC",
        createdAt: daysAgo(20),
      },
    }),
  ]);

  console.log("  Users: 13 (1 admin, 1 coach, 1 head coach, 10 athletes)");

  return {
    admin: at(users, 0),
    coach: at(users, 1),
    headCoach: at(users, 2),
    sarah: at(users, 3),
    mike: at(users, 4),
    jenny: at(users, 5),
    david: at(users, 6),
    lisa: at(users, 7),
    tom: at(users, 8),
    alex: at(users, 9),
    nina: at(users, 10),
    chris: at(users, 11),
    maria: at(users, 12),
  };
};

export type SeededUsers = Awaited<ReturnType<typeof seedUsers>>;
