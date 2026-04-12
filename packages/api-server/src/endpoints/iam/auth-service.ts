import bcrypt from "bcryptjs";

import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";

const DUMMY_BCRYPT_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export const iamAuthService = {
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  validateUser: async (email: string, rawPassword: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.password) {
      await bcrypt.compare(rawPassword, DUMMY_BCRYPT_HASH);

      return null;
    }

    const isValid = await iamAuthService.comparePassword(rawPassword, user.password);

    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: ROLE_MAP[user.role],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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

    if (!user) {
      return null;
    }

    return { ...user, role: ROLE_MAP[user.role] };
  },
};
