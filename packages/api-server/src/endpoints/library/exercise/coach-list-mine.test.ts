import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ExerciseStatus } from "@repo/contracts/library/exercise";

import { cleanup, createTestCoach } from "../../../test/helpers";
import { createTestExercise } from "../../../test/library-helpers";

import { libraryExerciseCoachApi } from "./coach";

const toCleanup: { table: string; id: string }[] = [];

describe("libraryExerciseCoachApi.listMine", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;

  beforeEach(async () => {
    coachA = await createTestCoach();
    coachB = await createTestCoach();

    toCleanup.push(
      { table: "coachProfile", id: coachA.profile.id },
      { table: "user", id: coachA.user.id },
      { table: "coachProfile", id: coachB.profile.id },
      { table: "user", id: coachB.user.id },
    );
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
  });

  it("returns only the caller's own exercises with paginated envelope", async () => {
    const ownUnique = crypto.randomUUID().slice(0, 8);
    const ownA = await createTestExercise(coachA.user.id, {
      status: "PENDING_REVIEW",
      canonicalName: `Own A ${ownUnique}`,
      normalizedName: `own a ${ownUnique}`,
    });
    const ownB = await createTestExercise(coachA.user.id, {
      status: "APPROVED",
      canonicalName: `Own B ${ownUnique}`,
      normalizedName: `own b ${ownUnique}`,
    });
    const otherExercise = await createTestExercise(coachB.user.id, { status: "APPROVED" });

    toCleanup.push({ table: "exercise", id: ownA.id });
    toCleanup.push({ table: "exercise", id: ownB.id });
    toCleanup.push({ table: "exercise", id: otherExercise.id });

    const result = await libraryExerciseCoachApi.listMine({ userId: coachA.user.id });
    const ids = result.items.map((item) => item.id);

    expect(ids).toContain(ownA.id);
    expect(ids).toContain(ownB.id);
    expect(ids).not.toContain(otherExercise.id);
    expect(typeof result.total).toBe("number");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it("honors the search query param", async () => {
    const tag = crypto.randomUUID().slice(0, 8);
    const match = await createTestExercise(coachA.user.id, {
      canonicalName: `Matching ${tag}`,
      normalizedName: `matching ${tag}`,
    });
    const miss = await createTestExercise(coachA.user.id, {
      canonicalName: `Ignored ${crypto.randomUUID().slice(0, 8)}`,
    });

    toCleanup.push({ table: "exercise", id: match.id });
    toCleanup.push({ table: "exercise", id: miss.id });

    const result = await libraryExerciseCoachApi.listMine({
      userId: coachA.user.id,
      search: tag,
    });
    const ids = result.items.map((item) => item.id);

    expect(ids).toContain(match.id);
    expect(ids).not.toContain(miss.id);
  });

  it("honors page and limit for pagination", async () => {
    const tag = crypto.randomUUID().slice(0, 8);

    for (let i = 0; i < 3; i += 1) {
      const ex = await createTestExercise(coachA.user.id, {
        canonicalName: `Page ${tag} ${i}`,
        normalizedName: `page ${tag} ${i}`,
      });

      toCleanup.push({ table: "exercise", id: ex.id });
    }

    const firstPage = await libraryExerciseCoachApi.listMine({
      userId: coachA.user.id,
      search: tag,
      page: 1,
      limit: 2,
    });
    const secondPage = await libraryExerciseCoachApi.listMine({
      userId: coachA.user.id,
      search: tag,
      page: 2,
      limit: 2,
    });

    expect(firstPage.items).toHaveLength(2);
    expect(secondPage.items).toHaveLength(1);
    expect(firstPage.total).toBe(3);
    expect(secondPage.total).toBe(3);
  });

  it("filters by statusFilter", async () => {
    const tag = crypto.randomUUID().slice(0, 8);
    const pending = await createTestExercise(coachA.user.id, {
      status: "PENDING_REVIEW",
      canonicalName: `Status ${tag} pending`,
      normalizedName: `status ${tag} pending`,
    });
    const approved = await createTestExercise(coachA.user.id, {
      status: "APPROVED",
      canonicalName: `Status ${tag} approved`,
      normalizedName: `status ${tag} approved`,
    });

    toCleanup.push({ table: "exercise", id: pending.id });
    toCleanup.push({ table: "exercise", id: approved.id });

    const result = await libraryExerciseCoachApi.listMine({
      userId: coachA.user.id,
      statusFilter: ExerciseStatus.PENDING_REVIEW,
      search: tag,
    });
    const ids = result.items.map((item) => item.id);

    expect(ids).toContain(pending.id);
    expect(ids).not.toContain(approved.id);
  });
});
