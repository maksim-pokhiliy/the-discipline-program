import "./types/next-auth-extensions";

import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { AUTH_CONSTANTS, type UserRole } from "@repo/contracts/iam/auth";
import { authEnv } from "@repo/env/auth";
import { UnauthorizedError } from "@repo/errors";

import { AUTH_ROUTES } from "./constants";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  tokenVersion: number;
};

export type AuthServiceAdapter = {
  validateUser: (email: string, password: string) => Promise<AuthUser | null>;
  getUserById: (id: string) => Promise<{ role: UserRole; tokenVersion: number } | null>;
};

const readSessionImageUpdate = (value: unknown): string | null | undefined => {
  if (typeof value !== "object" || value === null || !("image" in value)) {
    return undefined;
  }

  const image = value.image;

  if (typeof image === "string" || image === null) {
    return image;
  }

  return undefined;
};

export const createAuthOptions = (service: AuthServiceAdapter): NextAuthOptions => ({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await service.validateUser(credentials.email, credentials.password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion;

        return token;
      }

      if (trigger === "update") {
        const image = readSessionImageUpdate(session);

        if (image !== undefined) {
          token.image = image;
        }
      }

      const dbUser = await service.getUserById(token.id);

      if (!dbUser) {
        throw new UnauthorizedError("User no longer exists");
      }

      const jwtVersion = token.tokenVersion ?? 0;

      if (jwtVersion !== dbUser.tokenVersion) {
        throw new UnauthorizedError("Session invalidated");
      }

      token.role = dbUser.role;
      token.tokenVersion = dbUser.tokenVersion;

      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      session.user.email = token.email ?? null;
      session.user.name = token.name ?? null;
      session.user.image = token.image ?? null;
      session.user.role = token.role ?? null;

      return session;
    },
  },
  pages: {
    signIn: AUTH_ROUTES.LOGIN,
    error: AUTH_ROUTES.LOGIN,
  },
  session: {
    strategy: "jwt",
    maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE,
  },
  secret: authEnv.NEXTAUTH_SECRET,
});
