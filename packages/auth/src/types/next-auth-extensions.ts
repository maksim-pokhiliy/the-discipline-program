import "next-auth";
import "next-auth/jwt";

import { type UserRole } from "@repo/contracts/iam/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null | undefined;
      name?: string | null | undefined;
      image?: string | null | undefined;
      role: UserRole | null;
    };
  }

  interface User {
    id: string;
    email?: string | null | undefined;
    name?: string | null | undefined;
    image?: string | null | undefined;
    role: UserRole | null;
    tokenVersion?: number | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null | undefined;
    name?: string | null | undefined;
    image?: string | null | undefined;
    role: UserRole | null;
    tokenVersion?: number | undefined;
  }
}
