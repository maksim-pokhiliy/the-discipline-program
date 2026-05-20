import { describe, expect, it } from "vitest";

import {
  createAlternatingGroupRequestSchema,
  createAlternatingGroupResponseSchema,
  deleteAlternatingGroupParamsSchema,
  getAlternatingGroupsResponseSchema,
} from "./alternating-group-api.schema";
import { alternatingGroupSchema, createAlternatingGroupSchema } from "./alternating-group.schema";

const cuid = "clz1234567890123456789aaa";

describe("alternating-group api schemas", () => {
  it("getAlternatingGroupsResponseSchema accepts empty array", () => {
    expect(getAlternatingGroupsResponseSchema.safeParse([]).success).toBe(true);
  });

  it("createAlternatingGroupRequestSchema is createAlternatingGroupSchema", () => {
    expect(createAlternatingGroupRequestSchema).toBe(createAlternatingGroupSchema);
  });

  it("createAlternatingGroupResponseSchema is alternatingGroupSchema", () => {
    expect(createAlternatingGroupResponseSchema).toBe(alternatingGroupSchema);
  });

  it("deleteAlternatingGroupParamsSchema accepts a cuid id", () => {
    expect(deleteAlternatingGroupParamsSchema.safeParse({ id: cuid }).success).toBe(true);
  });

  it("deleteAlternatingGroupParamsSchema rejects missing id", () => {
    expect(deleteAlternatingGroupParamsSchema.safeParse({}).success).toBe(false);
  });
});
