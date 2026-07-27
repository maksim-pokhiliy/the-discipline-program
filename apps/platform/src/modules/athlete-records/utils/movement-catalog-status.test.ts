import { describe, expect, it } from "vitest";

import { type GetAthleteMovementsResponse } from "@repo/contracts/lms/exercise";

import { toMovementCatalogStatus } from "./movement-catalog-status";

const CATALOG: GetAthleteMovementsResponse = [
  { id: "clz0000000000000000000ex01", canonicalName: "Back Squat" },
];

describe("toMovementCatalogStatus", () => {
  it("reports loading while the first fetch is in flight", () => {
    expect(toMovementCatalogStatus({ data: undefined, isLoading: true, error: null })).toBe(
      "loading",
    );
  });

  it("reports an error when the fetch failed and left nothing behind", () => {
    expect(
      toMovementCatalogStatus({ data: undefined, isLoading: false, error: new Error("boom") }),
    ).toBe("error");
  });

  it("stays ready when a refetch errors over a catalog already in hand", () => {
    expect(
      toMovementCatalogStatus({ data: CATALOG, isLoading: false, error: new Error("boom") }),
    ).toBe("ready");
  });

  it("reports ready for a plain successful fetch", () => {
    expect(toMovementCatalogStatus({ data: CATALOG, isLoading: false, error: null })).toBe("ready");
  });

  it("treats an empty catalog as ready, not as a failure", () => {
    expect(toMovementCatalogStatus({ data: [], isLoading: false, error: null })).toBe("ready");
  });
});
