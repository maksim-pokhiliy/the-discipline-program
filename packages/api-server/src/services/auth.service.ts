import bcrypt from "bcryptjs";

import { prisma } from "../db/client";

export const authService = {
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  validateUser: async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    const safeUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        timezone: true,
      },
    });

    return safeUser;
  },

  getUserById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  },
};
