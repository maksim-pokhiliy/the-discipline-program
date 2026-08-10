import { describe, expect, it } from "vitest";

import { InternalServerError } from "@repo/errors";

import { assembleUserDto } from "./user-dto";

const baseRow = {
  legacyUserId: 1001,
  legacyRoleId: 1,
  legacyPlanId: 1,
  legacyLevelId: 2,
  isEnabled: true,
  firstName: "Denys",
  lastName: "Sergeev",
  phoneNumber: "+15551234567",
  dateOfBirth: new Date("1990-05-01T00:00:00.000Z"),
};

describe("assembleUserDto", () => {
  it("assembles every field of the legacy user dto", () => {
    expect(assembleUserDto(baseRow, "athlete@tdp.local")).toEqual({
      id: 1001,
      isEnabled: true,
      username: "athlete@tdp.local",
      userRole: { id: 1, name: "USER" },
      userPlan: { id: 1, name: "General" },
      trainingLevel: { id: 2, name: "Pro" },
      firstName: "Denys",
      lastName: "Sergeev",
      phoneNumber: "+15551234567",
      dateOfBirth: "1990-05-01",
      team: null,
    });
  });

  it("serializes a null date of birth as null", () => {
    expect(assembleUserDto({ ...baseRow, dateOfBirth: null }, "a@b.c").dateOfBirth).toBeNull();
  });

  it("uses the platform email as the username", () => {
    expect(assembleUserDto(baseRow, "someone@else.local").username).toBe("someone@else.local");
  });

  it("always reports a null team because the legacy stack has none", () => {
    expect(assembleUserDto(baseRow, "a@b.c").team).toBeNull();
  });

  it("throws a 500-path error rather than denying when a catalog id is unmapped", () => {
    expect(() => assembleUserDto({ ...baseRow, legacyRoleId: 77 }, "a@b.c")).toThrow(
      InternalServerError,
    );
  });
});
