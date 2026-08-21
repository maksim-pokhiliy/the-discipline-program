import { describe, expect, it } from "vitest";

import type { PlatformIdentity, PlatformSnapshot } from "./legacy-users-import-plan";
import { reconcileIdentityLinks } from "./legacy-users-import-reconcile";

const identity = (legacyUserId: number, userId: string): PlatformIdentity => ({
  legacyUserId,
  userId,
  importedPasswordHash: null,
  legacyRoleId: 1,
  legacyPlanId: 2,
  legacyLevelId: 2,
  isEnabled: true,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  dateOfBirth: null,
});

const snapshot = (overrides: Partial<PlatformSnapshot> = {}): PlatformSnapshot => ({
  identities: [],
  individualLinks: [],
  users: [],
  ...overrides,
});

describe("reconcileIdentityLinks", () => {
  it("passes a link whose athlete is the one the identity names", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(20, "user_a")],
        individualLinks: [{ legacyUserId: 20, athleteId: "user_a" }],
      }),
    );

    expect(result.conflicts).toEqual([]);
    expect(result.summary).toEqual({ linksChecked: 1, linksWithIdentity: 1, violations: 0 });
  });

  it("names a link that points at another platform user as a conflict", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(20, "user_a")],
        individualLinks: [{ legacyUserId: 20, athleteId: "user_b" }],
      }),
    );

    expect(result.conflicts).toEqual([
      {
        legacyUserId: 20,
        reason: "link-and-identity-disagree",
        detail: expect.stringContaining("name 1 platform user(s)"),
      },
    ]);
    expect(result.summary.violations).toBe(1);
  });

  it("counts a link whose legacy id was never imported, but never calls it a violation", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(20, "user_a")],
        individualLinks: [
          { legacyUserId: 20, athleteId: "user_a" },
          { legacyUserId: 77, athleteId: "user_unimported" },
        ],
      }),
    );

    expect(result.conflicts).toEqual([]);
    expect(result.summary).toEqual({ linksChecked: 2, linksWithIdentity: 1, violations: 0 });
  });

  it("checks links for legacy ids no export mentions, which is the blind spot it exists for", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(77, "user_a")],
        individualLinks: [{ legacyUserId: 77, athleteId: "user_b" }],
      }),
    );

    expect(result.summary.violations).toBe(1);
  });

  it("reports one conflict per legacy id however many links contradict it", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(20, "user_a")],
        individualLinks: [
          { legacyUserId: 20, athleteId: "user_b" },
          { legacyUserId: 20, athleteId: "user_c" },
        ],
      }),
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts.at(0)?.detail).toContain("name 2 platform user(s)");
    expect(result.summary).toEqual({ linksChecked: 2, linksWithIdentity: 2, violations: 1 });
  });

  it("does not double-count a legacy id whose links agree and disagree at once", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(20, "user_a")],
        individualLinks: [
          { legacyUserId: 20, athleteId: "user_a" },
          { legacyUserId: 20, athleteId: "user_b" },
        ],
      }),
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts.at(0)?.detail).toContain("name 1 platform user(s)");
  });

  it("counts the platform users the links name, not the link rows, when they agree with each other", () => {
    const result = reconcileIdentityLinks(
      snapshot({
        identities: [identity(20, "user_a")],
        individualLinks: [
          { legacyUserId: 20, athleteId: "user_b" },
          { legacyUserId: 20, athleteId: "user_b" },
        ],
      }),
    );

    expect(result.conflicts.at(0)?.detail).toContain("name 1 platform user(s)");
  });

  it("has nothing to say about a platform with no individual links at all", () => {
    const result = reconcileIdentityLinks(snapshot({ identities: [identity(20, "user_a")] }));

    expect(result.summary).toEqual({ linksChecked: 0, linksWithIdentity: 0, violations: 0 });
  });
});
