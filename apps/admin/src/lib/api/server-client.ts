import { cookies } from "next/headers";

import { ApiClient } from "@repo/api-client";
import { env } from "@repo/env";

export const serverApiClient = new ApiClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
  getHeaders: async () => {
    const cookieStore = await cookies();

    return { Cookie: cookieStore.toString() };
  },
});
