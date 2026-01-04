import NextAuth from "next-auth";

import { authOptions } from "./auth-options";

export * from "./constants";
export * from "./providers";
export * from "./utils";

export { signIn, signOut, useSession } from "next-auth/react";
export { getToken } from "next-auth/jwt";
export type { Session } from "next-auth";

const handler = NextAuth(authOptions);

export { handler as authHandler };
