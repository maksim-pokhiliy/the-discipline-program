import { describe, expect, it } from "vitest";

import { InternalServerError } from "@repo/errors";

import {
  assembleGeneralProgramDto,
  assembleIndividualProgramDto,
  type ProgramSnapshotRow,
} from "./program-dto";

const TRAINING_PROGRAM = {
  dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "STRENGTH", exercises: ["3 bench"] }] }],
};

const row = (overrides: Partial<ProgramSnapshotRow> = {}): ProgramSnapshotRow => ({
  legacyRowId: 1,
  scheduledDate: new Date("2026-08-15T00:00:00.000Z"),
  isRestDay: false,
  dailyProgram: TRAINING_PROGRAM,
  ...overrides,
});

describe("program-dto serializer", () => {
  describe("the ProgramView fatalError invariant (isRestDay=false, dailyProgram=null)", () => {
    it("throws for a general day rather than emit the fatalError shape", () => {
      expect(() =>
        assembleGeneralProgramDto(row({ isRestDay: false, dailyProgram: null }), 2),
      ).toThrow(InternalServerError);
    });

    it("throws for an individual day rather than emit the fatalError shape", () => {
      expect(() =>
        assembleIndividualProgramDto(row({ isRestDay: false, dailyProgram: null }), 1004),
      ).toThrow(InternalServerError);
    });
  });

  it("serializes a general training day to the legacy shape", () => {
    expect(assembleGeneralProgramDto(row({ legacyRowId: 7 }), 2)).toEqual({
      id: 7,
      scheduledDate: "2026-08-15",
      trainingLevel: { id: 2, name: "Pro" },
      isRestDay: false,
      dailyProgram: TRAINING_PROGRAM,
    });
  });

  it("serializes a general rest day with a null dailyProgram", () => {
    expect(
      assembleGeneralProgramDto(row({ legacyRowId: 8, isRestDay: true, dailyProgram: null }), 2),
    ).toEqual({
      id: 8,
      scheduledDate: "2026-08-15",
      trainingLevel: { id: 2, name: "Pro" },
      isRestDay: true,
      dailyProgram: null,
    });
  });

  it("serializes an individual day carrying the athlete userId", () => {
    expect(assembleIndividualProgramDto(row({ legacyRowId: 9 }), 1004)).toEqual({
      id: 9,
      userId: 1004,
      scheduledDate: "2026-08-15",
      isRestDay: false,
      dailyProgram: TRAINING_PROGRAM,
    });
  });

  it("throws when the training level id is not in the catalog rather than emit a broken level", () => {
    expect(() => assembleGeneralProgramDto(row(), 999)).toThrow(InternalServerError);
  });

  it("throws an InternalServerError when a stored training-day dailyProgram is a corrupt blob", () => {
    expect(() => assembleGeneralProgramDto(row({ dailyProgram: { garbage: true } }), 2)).toThrow(
      InternalServerError,
    );
  });
});
