import { afterEach, describe, expect, it } from "vitest";

import { ConflictError, ForbiddenError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { lmsModifierPlatformApi } from "./platform";

describe("lmsModifierPlatformApi.create", () => {
  const createdModifierIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdCoachProfileIds: string[] = [];

  afterEach(async () => {
    if (createdModifierIds.length > 0) {
      await cleanupRaw.modifier
        .deleteMany({ where: { id: { in: createdModifierIds.splice(0) } } })
        .catch(() => {});
    }

    for (const id of createdCoachProfileIds.splice(0).reverse()) {
      await cleanupRaw.coachProfile.delete({ where: { id } }).catch(() => {});
    }

    for (const id of createdUserIds.splice(0).reverse()) {
      await cleanupRaw.user.delete({ where: { id } }).catch(() => {});
    }
  });

  it("lets a coach create a modifier and lowercases the name into nameLower (QA-#10)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const name = `From Sofa ${crypto.randomUUID().slice(0, 8)}`;
    const created = await lmsModifierPlatformApi.create(coach.user.id, { name });

    createdModifierIds.push(created.id);

    expect(created.name).toBe(name);
    expect(created.nameLower).toBe(name.toLowerCase());

    const stored = await cleanupRaw.modifier.findUnique({ where: { id: created.id } });

    expect(stored?.nameLower).toBe(name.toLowerCase());
  });

  it("rejects a non-coach (athlete) caller with ForbiddenError (QA-#10)", async () => {
    const athlete = await createTestUser();

    createdUserIds.push(athlete.id);

    await expect(
      lmsModifierPlatformApi.create(athlete.id, {
        name: `Denied ${crypto.randomUUID().slice(0, 8)}`,
      }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      lmsModifierPlatformApi.create(athlete.id, {
        name: `Denied ${crypto.randomUUID().slice(0, 8)}`,
      }),
    ).rejects.toMatchObject({ message: "Coach role required" });
  });

  it("rejects a duplicate name (case-folded) with a 409 ConflictError (QA-#10)", async () => {
    const coach = await createTestCoach();

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    const name = `Box Or Sofa ${crypto.randomUUID().slice(0, 8)}`;
    const first = await lmsModifierPlatformApi.create(coach.user.id, { name });

    createdModifierIds.push(first.id);

    await expect(
      lmsModifierPlatformApi.create(coach.user.id, { name: name.toUpperCase() }),
    ).rejects.toThrow(ConflictError);
    await expect(
      lmsModifierPlatformApi.create(coach.user.id, { name: name.toUpperCase() }),
    ).rejects.toMatchObject({
      message: "Modifier with this name already exists",
      details: { field: "name" },
    });

    const count = await cleanupRaw.modifier.count({
      where: { nameLower: name.toLowerCase() },
    });

    expect(count).toBe(1);
  });
});
