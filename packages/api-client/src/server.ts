import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@repo/auth";
import { baseEnv } from "@repo/env/base";

import { ApiClient } from "./client";

export const createNextServerClient = () =>
  new ApiClient({
    baseUrl: baseEnv.NEXT_PUBLIC_APP_URL,
    getHeaders: async () => {
      const cookieStore = await cookies();

      return { Cookie: cookieStore.toString() };
    },
    onUnauthorized: () => redirect(AUTH_ROUTES.LOGOUT),
  });
