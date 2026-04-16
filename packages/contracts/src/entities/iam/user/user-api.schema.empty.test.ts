import { describe, expect, it } from "vitest";

import {
  getUsersPageDataResponseSchema,
  getUsersResponseSchema,
  searchUsersResponseSchema,
} from "./user-api.schema";

describe("user-api schema empty payloads", () => {
  it("getUsersResponseSchema accepts empty array", () => {
    const result = getUsersResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getUsersResponseSchema rejects null", () => {
    const result = getUsersResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getUsersPageDataResponseSchema accepts empty users list", () => {
    const result = getUsersPageDataResponseSchema.safeParse({ users: [] });

    expect(result.success).toBe(true);
  });

  it("getUsersPageDataResponseSchema rejects missing users key", () => {
    const result = getUsersPageDataResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("searchUsersResponseSchema accepts empty array", () => {
    const result = searchUsersResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("searchUsersResponseSchema rejects null", () => {
    const result = searchUsersResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
