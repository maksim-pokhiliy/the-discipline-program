import { describe, expect, it } from "vitest";

import {
  findLegacyCatalogEntry,
  LEGACY_TRAINING_LEVELS,
  LEGACY_USER_PLANS,
  LEGACY_USER_ROLES,
} from "./legacy-catalogs";

describe("legacy catalogs", () => {
  it("serves the training levels the production database holds, in id order", () => {
    expect(LEGACY_TRAINING_LEVELS).toEqual([
      { id: 1, name: "Scaled" },
      { id: 2, name: "Pro" },
      { id: 3, name: "Advanced" },
      { id: 4, name: "Functional Bodybuilding" },
    ]);
  });

  it("serves the user plans the production database holds, in id order", () => {
    expect(LEGACY_USER_PLANS).toEqual([
      { id: 1, name: "General" },
      { id: 2, name: "Individual" },
    ]);
  });

  it("serves the user roles the production database holds, in id order", () => {
    expect(LEGACY_USER_ROLES).toEqual([
      { id: 1, name: "USER" },
      { id: 2, name: "ADMIN" },
    ]);
  });

  it("finds an entry by id", () => {
    expect(findLegacyCatalogEntry(LEGACY_USER_ROLES, 2)).toEqual({ id: 2, name: "ADMIN" });
  });

  it("returns null for an id the catalog does not know", () => {
    expect(findLegacyCatalogEntry(LEGACY_USER_PLANS, 99)).toBeNull();
  });
});
