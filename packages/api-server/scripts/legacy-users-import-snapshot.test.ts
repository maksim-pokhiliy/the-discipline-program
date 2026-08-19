import { describe, expect, it } from "vitest";

import { GOLDEN_BCRYPT_HASH } from "../src/test/golden-fixture";

import type { PlatformIdentity } from "./legacy-users-import-plan";
import {
  type ImportReader,
  INDIVIDUAL_CHANNEL,
  loadPlatformSnapshot,
} from "./legacy-users-import-snapshot";
import { type LegacySourceRow, normalizeLegacySource } from "./legacy-users-import-source";

const DEMO_LEGACY_USER_ID = 990001;

type Recorded = { identityArgs: unknown[]; linkArgs: unknown[]; userArgs: unknown[] };

const identityRow = (legacyUserId: number, userId: string): PlatformIdentity => ({
  legacyUserId,
  userId,
  legacyRoleId: 1,
  legacyPlanId: 1,
  legacyLevelId: 2,
  isEnabled: true,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  dateOfBirth: null,
});

const fakeReader = (
  seed: {
    identities?: PlatformIdentity[];
    links?: { legacyUserId: number | null; athleteId: string | null }[];
    users?: {
      id: string;
      email: string;
      role: string;
      deletedAt: Date | null;
      password: string | null;
      legacyIdentity: { legacyUserId: number } | null;
    }[];
  } = {},
) => {
  const recorded: Recorded = { identityArgs: [], linkArgs: [], userArgs: [] };
  const reader = {
    mobileLegacyIdentity: {
      findMany: (args: unknown) => {
        recorded.identityArgs.push(args);

        return Promise.resolve(seed.identities ?? []);
      },
    },
    mobilePublishLink: {
      findMany: (args: unknown) => {
        recorded.linkArgs.push(args);

        return Promise.resolve(seed.links ?? []);
      },
    },
    user: {
      findMany: (args: unknown) => {
        recorded.userArgs.push(args);

        return Promise.resolve(seed.users ?? []);
      },
    },
  };

  return { reader: reader as unknown as ImportReader, recorded };
};

const sourceRow = (overrides: Partial<LegacySourceRow> = {}): LegacySourceRow => ({
  id: 20,
  username: "athlete@tdp.local",
  password: GOLDEN_BCRYPT_HASH,
  user_role_id: 1,
  training_level_id: 2,
  first_name: null,
  last_name: null,
  phone_number: null,
  date_of_birth: null,
  team_id: null,
  user_plan_id: 1,
  is_enabled: true,
  ...overrides,
});

const rowsFrom = (...rows: LegacySourceRow[]) => normalizeLegacySource(rows).rows;

describe("loadPlatformSnapshot", () => {
  it("queries nothing at all for an empty export", async () => {
    const { reader, recorded } = fakeReader();
    const snapshot = await loadPlatformSnapshot(reader, []);

    expect(snapshot).toEqual({ identities: [], individualLinks: [], users: [] });
    expect(recorded).toEqual({ identityArgs: [], linkArgs: [], userArgs: [] });
  });

  it("windows the identity read to the legacy id range the export spans", async () => {
    const { reader, recorded } = fakeReader();

    await loadPlatformSnapshot(
      reader,
      rowsFrom(sourceRow({ id: 3 }), sourceRow({ id: 24, username: "b@tdp.local" })),
    );

    expect(recorded.identityArgs.at(0)).toMatchObject({
      where: { legacyUserId: { gte: 3, lte: 24 } },
    });
  });

  it("leaves the demo athlete outside the window, so the import can never reach it", async () => {
    const { reader, recorded } = fakeReader();

    await loadPlatformSnapshot(
      reader,
      rowsFrom(sourceRow({ id: 1 }), sourceRow({ id: 24, username: "b@tdp.local" })),
    );

    const where = recorded.identityArgs.at(0) as { where: { legacyUserId: { lte: number } } };

    expect(where.where.legacyUserId.lte).toBeLessThan(DEMO_LEGACY_USER_ID);
  });

  it("reads only individual links that actually name an athlete", async () => {
    const { reader, recorded } = fakeReader();

    await loadPlatformSnapshot(reader, rowsFrom(sourceRow()));

    expect(recorded.linkArgs.at(0)).toMatchObject({
      where: {
        channel: INDIVIDUAL_CHANNEL,
        legacyUserId: { in: [20] },
        NOT: { athleteId: null },
      },
    });
  });

  it("drops link rows whose columns are null despite the filter", async () => {
    const { reader } = fakeReader({
      links: [
        { legacyUserId: 20, athleteId: "user_linked" },
        { legacyUserId: null, athleteId: "user_orphan" },
        { legacyUserId: 20, athleteId: null },
      ],
    });
    const snapshot = await loadPlatformSnapshot(reader, rowsFrom(sourceRow()));

    expect(snapshot.individualLinks).toEqual([{ legacyUserId: 20, athleteId: "user_linked" }]);
  });

  it("reads users by both the export addresses and every related platform id", async () => {
    const { reader, recorded } = fakeReader({
      identities: [identityRow(20, "user_identity")],
      links: [{ legacyUserId: 20, athleteId: "user_linked" }],
    });

    await loadPlatformSnapshot(reader, rowsFrom(sourceRow()));

    expect(recorded.userArgs.at(0)).toMatchObject({
      where: {
        OR: [
          { email: { in: ["athlete@tdp.local"] } },
          { id: { in: ["user_identity", "user_linked"] } },
        ],
      },
    });
  });

  it("projects deletedAt and the credential, which the classifier needs to see", async () => {
    const { reader, recorded } = fakeReader();

    await loadPlatformSnapshot(reader, rowsFrom(sourceRow()));

    expect(recorded.userArgs.at(0)).toMatchObject({
      select: {
        deletedAt: true,
        password: true,
        legacyIdentity: { select: { legacyUserId: true } },
      },
    });
  });

  it("flattens the nested legacy identity onto the platform user", async () => {
    const { reader } = fakeReader({
      users: [
        {
          id: "user_platform",
          email: "athlete@tdp.local",
          role: "COACH",
          deletedAt: null,
          password: null,
          legacyIdentity: { legacyUserId: 7 },
        },
      ],
    });
    const snapshot = await loadPlatformSnapshot(reader, rowsFrom(sourceRow()));

    expect(snapshot.users).toEqual([
      {
        id: "user_platform",
        email: "athlete@tdp.local",
        role: "COACH",
        deletedAt: null,
        password: null,
        identityLegacyUserId: 7,
      },
    ]);
  });

  it("reports a user with no legacy identity as carrying none", async () => {
    const { reader } = fakeReader({
      users: [
        {
          id: "user_platform",
          email: "athlete@tdp.local",
          role: "ATHLETE",
          deletedAt: null,
          password: null,
          legacyIdentity: null,
        },
      ],
    });
    const snapshot = await loadPlatformSnapshot(reader, rowsFrom(sourceRow()));

    expect(snapshot.users.at(0)?.identityLegacyUserId).toBeNull();
  });
});
