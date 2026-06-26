import { describe, expect, it } from "vitest";

import {
  legacyAthleteSchema,
  legacyGeneralProgramSchema,
  legacyIndividualProgramSchema,
  legacySigninResponseSchema,
  legacyTrainingLevelsSchema,
} from "./legacy-mobile.schema";

const baseSignin = {
  userId: 42,
  accessToken: "jwt-token",
  userRole: { id: 1, name: "COACH" },
  userPlan: { id: 2, name: "PRO" },
};

describe("legacySigninResponseSchema", () => {
  it("transforms a numeric userId to a string", () => {
    const result = legacySigninResponseSchema.safeParse(baseSignin);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.userId).toBe("42");
    }
  });

  it("keeps a string userId as a string", () => {
    const result = legacySigninResponseSchema.safeParse({ ...baseSignin, userId: "abc" });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.userId).toBe("abc");
    }
  });

  it("rejects an empty accessToken", () => {
    const result = legacySigninResponseSchema.safeParse({ ...baseSignin, accessToken: "" });

    expect(result.success).toBe(false);
  });
});

describe("legacyTrainingLevelsSchema", () => {
  it("accepts an array of training levels", () => {
    const result = legacyTrainingLevelsSchema.safeParse([
      { id: 1, name: "RX" },
      { id: 2, name: "Scaled" },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects a non-integer level id", () => {
    const result = legacyTrainingLevelsSchema.safeParse([{ id: 1.5, name: "RX" }]);

    expect(result.success).toBe(false);
  });
});

describe("legacyGeneralProgramSchema", () => {
  it("accepts a rest-day program with a null dailyProgram", () => {
    const result = legacyGeneralProgramSchema.safeParse({
      id: 10,
      scheduledDate: "2026-06-22",
      trainingLevel: { id: 1, name: "RX" },
      isRestDay: true,
      dailyProgram: null,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a training-day program with nested blocks", () => {
    const result = legacyGeneralProgramSchema.safeParse({
      id: 11,
      scheduledDate: "2026-06-23",
      trainingLevel: { id: 1, name: "RX" },
      isRestDay: false,
      dailyProgram: {
        dayTrainings: [
          {
            trainingNumber: 1,
            blocks: [{ name: "Strength", exercises: ["Back Squat 5x5"] }],
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a program missing isRestDay", () => {
    const result = legacyGeneralProgramSchema.safeParse({
      id: 12,
      scheduledDate: "2026-06-24",
      trainingLevel: { id: 1, name: "RX" },
      dailyProgram: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("legacyIndividualProgramSchema", () => {
  it("accepts a training-day program keyed by a flat userId", () => {
    const result = legacyIndividualProgramSchema.safeParse({
      id: 31,
      userId: 5,
      scheduledDate: "2026-06-22",
      isRestDay: false,
      dailyProgram: {
        dayTrainings: [
          {
            trainingNumber: 1,
            blocks: [{ name: "Strength", exercises: ["Back Squat 5x5"] }],
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts a rest-day program with a null dailyProgram", () => {
    const result = legacyIndividualProgramSchema.safeParse({
      id: 32,
      userId: 5,
      scheduledDate: "2026-06-23",
      isRestDay: true,
      dailyProgram: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a program missing isRestDay", () => {
    const result = legacyIndividualProgramSchema.safeParse({
      id: 33,
      userId: 5,
      scheduledDate: "2026-06-24",
      dailyProgram: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("legacyAthleteSchema", () => {
  it("accepts an athlete with present names", () => {
    const result = legacyAthleteSchema.safeParse({
      id: 5,
      username: "athlete@tdp.local",
      firstName: "Test",
      lastName: "Athlete",
    });

    expect(result.success).toBe(true);
  });

  it("accepts an athlete with null firstName and lastName", () => {
    const result = legacyAthleteSchema.safeParse({
      id: 6,
      username: "athlete2@tdp.local",
      firstName: null,
      lastName: null,
    });

    expect(result.success).toBe(true);
  });

  it("tolerates extra UserRequestDTO fields and strips them", () => {
    const result = legacyAthleteSchema.safeParse({
      id: 7,
      username: "athlete3@tdp.local",
      firstName: "Pat",
      lastName: "Lee",
      isEnabled: true,
      userRole: { id: 1, name: "USER" },
      userPlan: { id: 2, name: "Individual" },
      phoneNumber: "555-0100",
      dateOfBirth: "1990-01-01",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).not.toHaveProperty("isEnabled");
      expect(result.data).not.toHaveProperty("phoneNumber");
    }
  });

  it("rejects an athlete missing the username", () => {
    const result = legacyAthleteSchema.safeParse({
      id: 8,
      firstName: "Pat",
      lastName: "Lee",
    });

    expect(result.success).toBe(false);
  });
});
