"use client";

import { ApiClient } from "@repo/api";

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
});
