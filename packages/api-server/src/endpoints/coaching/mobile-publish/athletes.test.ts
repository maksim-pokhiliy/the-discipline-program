import { randomInt } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanupRaw, createTestLegacyIdentity, createTestUser } from "../../../test/helpers";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

import { athletesApi, SYNTHETIC_LEGACY_USER_ID_FLOOR } from "./athletes";

const LEGACY_PLAN_GENERAL = 1;
const REAL_ID_FLOOR = 100_000;
const SYNTHETIC_ID_OFFSET = 1_000;
const SYNTHETIC_ID_SPAN = 9_000;
const CALLER_USER_ID = "clcaller00000000000000000";

const mintRealLegacyUserId = (): number => randomInt(REAL_ID_FLOOR, SYNTHETIC_LEGACY_USER_ID_FLOOR);

const userIds: string[] = [];

const seedIdentity = async (
  legacyUserId: number,
  overrides: { legacyPlanId?: number; isEnabled?: boolean; deletedAt?: Date } = {},
) => {
  const user = await createTestUser(
    overrides.deletedAt === undefined ? {} : { deletedAt: overrides.deletedAt },
  );

  userIds.push(user.id);

  await createTestLegacyIdentity(user.id, {
    legacyUserId,
    legacyPlanId: overrides.legacyPlanId ?? LEGACY_PLAN_INDIVIDUAL,
    isEnabled: overrides.isEnabled ?? true,
    firstName: "Synthetic",
    lastName: `Athlete ${legacyUserId}`,
  });

  return { user, legacyUserId };
};

describe("athletesApi.listIndividualAthletes", () => {
  const lowerId = mintRealLegacyUserId();
  const higherId = lowerId + 1;
  const disabledId = lowerId + 2;
  const generalId = lowerId + 3;
  const deletedId = lowerId + 4;
  const floorId = SYNTHETIC_LEGACY_USER_ID_FLOOR;
  const syntheticId =
    SYNTHETIC_LEGACY_USER_ID_FLOOR + randomInt(SYNTHETIC_ID_OFFSET, SYNTHETIC_ID_SPAN);

  let lowerEmail = "";

  beforeAll(async () => {
    await seedIdentity(higherId);
    lowerEmail = (await seedIdentity(lowerId)).user.email;
    await seedIdentity(disabledId, { isEnabled: false });
    await seedIdentity(generalId, { legacyPlanId: LEGACY_PLAN_GENERAL });
    await seedIdentity(deletedId, { deletedAt: new Date() });
    await seedIdentity(floorId);
    await seedIdentity(syntheticId);
  });

  afterAll(async () => {
    await cleanupRaw.user.deleteMany({ where: { id: { in: userIds } } });
  });

  const listedIds = async (): Promise<number[]> =>
    (await athletesApi.listIndividualAthletes(CALLER_USER_ID)).map((athlete) => athlete.id);

  it("pins the synthetic floor at 990000", () => {
    expect(SYNTHETIC_LEGACY_USER_ID_FLOOR).toBe(990_000);
  });

  it("lists Individual-plan identities in legacyUserId order", async () => {
    const ids = await listedIds();

    expect(ids).toContain(lowerId);
    expect(ids).toContain(higherId);
    expect(ids.indexOf(lowerId)).toBeLessThan(ids.indexOf(higherId));
  });

  it("returns the user's email as the username with the identity's names", async () => {
    const athletes = await athletesApi.listIndividualAthletes(CALLER_USER_ID);

    expect(athletes.find((athlete) => athlete.id === lowerId)).toEqual({
      id: lowerId,
      username: lowerEmail,
      firstName: "Synthetic",
      lastName: `Athlete ${lowerId}`,
    });
  });

  it("includes an identity the legacy backend had disabled", async () => {
    expect(await listedIds()).toContain(disabledId);
  });

  it("leaves out identities on the General plan", async () => {
    expect(await listedIds()).not.toContain(generalId);
  });

  it("leaves out identities whose user is soft-deleted", async () => {
    expect(await listedIds()).not.toContain(deletedId);
  });

  it("leaves out the synthetic range from the floor upwards", async () => {
    const ids = await listedIds();

    expect(ids).not.toContain(floorId);
    expect(ids).not.toContain(syntheticId);
    expect(ids.every((id) => id < SYNTHETIC_LEGACY_USER_ID_FLOOR)).toBe(true);
  });
});
