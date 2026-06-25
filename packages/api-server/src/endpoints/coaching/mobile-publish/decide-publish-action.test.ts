import { describe, expect, it } from "vitest";

import { type LegacyGeneralProgram } from "../../../infrastructure/legacy-mobile";

import { decidePublishAction } from "./decide-publish-action";

const HASH = "hash-a";

const legacyRow = (): LegacyGeneralProgram => ({
  id: 42,
  scheduledDate: "2026-06-22",
  trainingLevelId: 7,
  isRestDay: false,
  dailyProgram: null,
});

describe("decidePublishAction", () => {
  it("creates via POST when there is no record and no legacy row", () => {
    const decision = decidePublishAction({
      existingRecord: null,
      legacyRow: null,
      hash: HASH,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "created", write: "POST" });
  });

  it("conflicts with no write when an unowned legacy row exists and overwrite is off", () => {
    const decision = decidePublishAction({
      existingRecord: null,
      legacyRow: legacyRow(),
      hash: HASH,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "conflict", write: "none" });
  });

  it("updates via PUT when an unowned legacy row exists and overwrite is on", () => {
    const decision = decidePublishAction({
      existingRecord: null,
      legacyRow: legacyRow(),
      hash: HASH,
      overwriteUnowned: true,
    });

    expect(decision).toEqual({ action: "updated", write: "PUT" });
  });

  it("skips with no write when the record hash matches the projected hash", () => {
    const decision = decidePublishAction({
      existingRecord: { contentHash: HASH },
      legacyRow: legacyRow(),
      hash: HASH,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "skipped", write: "none" });
  });

  it("updates via PUT when the record hash differs from the projected hash", () => {
    const decision = decidePublishAction({
      existingRecord: { contentHash: "hash-b" },
      legacyRow: legacyRow(),
      hash: HASH,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "updated", write: "PUT" });
  });

  it("recreates via POST when a record exists but the legacy row is gone", () => {
    const decision = decidePublishAction({
      existingRecord: { contentHash: HASH },
      legacyRow: null,
      hash: HASH,
      overwriteUnowned: false,
    });

    expect(decision).toEqual({ action: "created", write: "POST" });
  });
});
