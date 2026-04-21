import { Role as PrismaRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_MAP } from "./enum-maps";

describe("ROLE_MAP", () => {
  it("covers every Prisma Role value", () => {
    const prismaValues = Object.values(PrismaRole);

    expect(Object.keys(ROLE_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(ROLE_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(ROLE_MAP.ATHLETE).toBe(UserRole.ATHLETE);
    expect(ROLE_MAP.COACH).toBe(UserRole.COACH);
    expect(ROLE_MAP.ADMIN).toBe(UserRole.ADMIN);
  });
});

describe("symmetry", () => {
  it("no two Prisma keys map to the same contract value in any iam map", () => {
    const maps = [ROLE_MAP];

    maps.forEach((map) => {
      const values = Object.values(map);
      const unique = new Set(values);

      expect(unique.size).toBe(values.length);
    });
  });
});
