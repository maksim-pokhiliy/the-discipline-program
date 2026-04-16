import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { coachingCoachActionItemApi } from "./coach-action-item";

describe("coachingCoachActionItemApi.reconcile — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    coach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { timezone: "UTC" },
    });
  });

  afterAll(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { coachId: coach.profile.id } })
      .catch(() => {});

    await cleanup(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("returns zeroed counts for coach with no enrollments", async () => {
    const result = await coachingCoachActionItemApi.reconcile(coach.user.id);

    expect(result.created).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.resolved).toBe(0);
    expect(result.coachId).toBe(coach.profile.id);
  });

  it("leaves no open action items after reconcile", async () => {
    await coachingCoachActionItemApi.reconcile(coach.user.id);

    const openItems = await cleanupRaw.coachActionItem.findMany({
      where: { coachId: coach.profile.id },
    });

    expect(openItems).toHaveLength(0);
  });

  it("is idempotent when run twice on empty state", async () => {
    const first = await coachingCoachActionItemApi.reconcile(coach.user.id);
    const second = await coachingCoachActionItemApi.reconcile(coach.user.id);

    expect(first.created).toBe(0);
    expect(second.created).toBe(0);
    expect(first.updated).toBe(0);
    expect(second.updated).toBe(0);
    expect(first.resolved).toBe(0);
    expect(second.resolved).toBe(0);
  });
});
