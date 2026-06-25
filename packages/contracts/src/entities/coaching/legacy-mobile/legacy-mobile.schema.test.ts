import { describe, expect, it } from "vitest";

import {
  legacyGeneralProgramSchema,
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
