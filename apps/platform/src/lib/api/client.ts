import { ApiClient } from "@repo/api-client";
import { env } from "@repo/env";

export const apiClient = new ApiClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  credentials: "include",
  getHeaders: async (): Promise<Record<string, string>> => {
    if (typeof window !== "undefined") {
      return {};
    }

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    return { Cookie: cookieStore.toString() };
  },
});
