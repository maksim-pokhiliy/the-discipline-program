import "./types/next-auth-extensions";

import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { authService } from "@repo/api-server";
import { AUTH_CONSTANTS } from "@repo/contracts/auth";
import { authEnv } from "@repo/env/auth";

import { AUTH_ROUTES } from "./constants";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authService.validateUser(credentials.email, credentials.password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;

        return token;
      }

      const dbUser = await authService.getUserById(token.id);

      if (!dbUser) {
        throw new Error("User no longer exists");
      }

      token.role = dbUser.role;

      return token;
    },
    async session({ session, token }) {
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
};
