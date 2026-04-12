import bcrypt from "bcryptjs";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

import { prisma } from "../../db/client";
import { ROLE_MAP } from "../../mappers/iam";

const DUMMY_BCRYPT_HASH = "$2a$12$S36pNti6wcybeTTi3sB46ek1KmB7Vk0U0gXqTEJRx3D8xI/TRRjGi";

export const iamAuthService = {
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_COST_FACTOR);
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  validateUser: async (email: string, rawPassword: string) => {
    if (rawPassword.length > AUTH_CONSTANTS.MAX_PASSWORD_LENGTH) {
      return null;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
