import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: Role;
  }

  interface Session extends DefaultSession {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: Role;
  }
}
