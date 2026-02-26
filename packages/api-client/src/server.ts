import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@repo/env";

import { ApiClient } from "./client";

export const createNextServerClient = () =>
  new ApiClient({
    baseUrl: env.NEXT_PUBLIC_API_URL,
    getHeaders: async () => {
      const cookieStore = await cookies();

      return { Cookie: cookieStore.toString() };
    },
    onUnauthorized: () => redirect("/api/auth/logout"),
  });
