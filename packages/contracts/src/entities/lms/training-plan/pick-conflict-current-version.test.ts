import { describe, expect, it } from "vitest";

import { pickConflictCurrentVersion } from "./pick-conflict-current-version";
import { type BulkPatchConflict } from "./training-plan-api.types";

describe("pickConflictCurrentVersion", () => {
  it("returns the first conflict's currentVersion when present", () => {
    const conflicts: BulkPatchConflict[] = [
      { opIndex: 0, kind: "update-segment", currentVersion: 7 },
    ];

    expect(pickConflictCurrentVersion(conflicts, 1)).toBe(7);
  });

  it("prefers the first conflict over later entries", () => {
    const conflicts: BulkPatchConflict[] = [
      { opIndex: 2, kind: "update-block", currentVersion: 12 },
      { opIndex: 5, kind: "update-segment", currentVersion: 99 },
    ];

    expect(pickConflictCurrentVersion(conflicts, 1)).toBe(12);
  });

  it("returns the fallback when conflicts is undefined", () => {
    expect(pickConflictCurrentVersion(undefined, 4)).toBe(4);
  });

  it("returns the fallback when conflicts is empty", () => {
    expect(pickConflictCurrentVersion([], 3)).toBe(3);
  });

  it("uses the server's currentVersion even when it is below the fallback", () => {
    const conflicts: BulkPatchConflict[] = [
      { opIndex: 0, kind: "update-entry", currentVersion: 1 },
    ];

    expect(pickConflictCurrentVersion(conflicts, 99)).toBe(1);
  });
});
