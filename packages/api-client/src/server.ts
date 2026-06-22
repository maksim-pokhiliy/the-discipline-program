import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@repo/auth";
import { baseEnv } from "@repo/env/base";

import { ApiClient } from "./client";

const resolveSelfBaseUrl = () =>
  baseEnv.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : baseEnv.NEXT_PUBLIC_APP_URL;

export const createNextServerClient = () =>
  new ApiClient({
    baseUrl: resolveSelfBaseUrl(),
    cache: "no-store",
    getHeaders: async () => {
      const cookieStore = await cookies();

      return { Cookie: cookieStore.toString() };
    },
    onUnauthorized: () => redirect(AUTH_ROUTES.LOGIN),
  });
