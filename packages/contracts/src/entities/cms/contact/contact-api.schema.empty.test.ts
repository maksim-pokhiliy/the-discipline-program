import { describe, expect, it } from "vitest";

import {
  getContactSubmissionsResponseSchema,
  getContactsPageDataResponseSchema,
} from "./contact-api.schema";

describe("contact-api schema empty payloads", () => {
  it("getContactSubmissionsResponseSchema accepts empty array", () => {
    const result = getContactSubmissionsResponseSchema.safeParse([]);

    expect(result.success).toBe(true);
  });

  it("getContactSubmissionsResponseSchema rejects null", () => {
    const result = getContactSubmissionsResponseSchema.safeParse(null);

    expect(result.success).toBe(false);
  });

  it("getContactsPageDataResponseSchema accepts empty contacts list", () => {
    const result = getContactsPageDataResponseSchema.safeParse({ contacts: [] });

    expect(result.success).toBe(true);
  });

  it("getContactsPageDataResponseSchema rejects missing contacts key", () => {
    const result = getContactsPageDataResponseSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
