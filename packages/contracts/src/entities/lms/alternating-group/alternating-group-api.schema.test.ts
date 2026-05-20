import { describe, expect, it } from "vitest";

import {
  addMemberAlternatingGroupRequestSchema,
  addMemberAlternatingGroupResponseSchema,
  createAlternatingGroupRequestSchema,
  createAlternatingGroupResponseSchema,
  deleteAlternatingGroupParamsSchema,
  getAlternatingGroupsResponseSchema,
  removeMemberAlternatingGroupRequestSchema,
  removeMemberAlternatingGroupResponseSchema,
} from "./alternating-group-api.schema";
import { alternatingGroupSchema, createAlternatingGroupSchema } from "./alternating-group.schema";

const cuid = "clz1234567890123456789aaa";
const cuidB = "clz1234567890123456789bbb";
const cuidC = "clz1234567890123456789ccc";

const group = {
  id: cuid,
  blockId: cuidB,
  relationKind: "ALTERNATING_SETS",
  schemaIds: [cuidB, cuidC],
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

  it("addMemberAlternatingGroupRequestSchema accepts a cuid schemaId", () => {
    expect(addMemberAlternatingGroupRequestSchema.safeParse({ schemaId: cuid }).success).toBe(true);
  });

  it("addMemberAlternatingGroupRequestSchema rejects a missing schemaId", () => {
    expect(addMemberAlternatingGroupRequestSchema.safeParse({}).success).toBe(false);
  });

  it("addMemberAlternatingGroupRequestSchema rejects a non-cuid schemaId", () => {
    expect(
      addMemberAlternatingGroupRequestSchema.safeParse({ schemaId: "not-a-cuid" }).success,
    ).toBe(false);
  });

  it("addMemberAlternatingGroupResponseSchema is alternatingGroupSchema", () => {
    expect(addMemberAlternatingGroupResponseSchema).toBe(alternatingGroupSchema);
  });

  it("removeMemberAlternatingGroupRequestSchema is addMemberAlternatingGroupRequestSchema", () => {
    expect(removeMemberAlternatingGroupRequestSchema).toBe(addMemberAlternatingGroupRequestSchema);
  });

  it("removeMemberAlternatingGroupResponseSchema accepts a valid group object", () => {
    expect(removeMemberAlternatingGroupResponseSchema.safeParse(group).success).toBe(true);
  });

  it("removeMemberAlternatingGroupResponseSchema accepts null", () => {
    expect(removeMemberAlternatingGroupResponseSchema.safeParse(null).success).toBe(true);
  });
});
