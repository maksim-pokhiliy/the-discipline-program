import { describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../mappers/iam";

import {
  findHeadCoachHolders,
  releaseHeadCoachSlot,
  releaseHeadCoachSlotAfter,
  takeHeadCoachSlot,
} from "./head-coach-slot";
import { cleanupRaw, createTestUser } from "./helpers";

const HOLDER_UPDATED_AT = new Date("2020-01-02T03:04:05.678Z");
const UNIQUE_VIOLATION = { code: "P2002" };
const RECORD_NOT_FOUND = { code: "P2025" };

const holderAt = (id: string): { id: string; updatedAt: Date } => ({
  id,
  updatedAt: HOLDER_UPDATED_AT,
});

const withOwnHolder = async (body: (holderId: string) => Promise<void>): Promise<void> => {
  const outerSlot = await takeHeadCoachSlot();

  try {
    const holder = await createTestUser({
      role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH],
      updatedAt: HOLDER_UPDATED_AT,
    });

    try {
      await body(holder.id);
    } finally {
      await cleanupRaw.user.delete({ where: { id: holder.id } });
    }
  } finally {
    await releaseHeadCoachSlot(outerSlot);
  }
};

describe("head-coach slot", () => {
  it("takes the role from its holder and gives back the role and the exact updatedAt", async () => {
    await withOwnHolder(async (holderId) => {
      const slot = await takeHeadCoachSlot();

      expect(slot).toEqual({ previousHolders: [holderAt(holderId)] });
      expect(await findHeadCoachHolders()).toEqual([]);

      const demoted = await cleanupRaw.user.findUniqueOrThrow({
        where: { id: holderId },
        select: { role: true, updatedAt: true },
      });

      expect(demoted.role).toBe(ROLE_TO_PRISMA_MAP[UserRole.COACH]);
      expect(demoted.updatedAt).not.toEqual(HOLDER_UPDATED_AT);

      await releaseHeadCoachSlot(slot);

      expect(await findHeadCoachHolders()).toEqual([holderAt(holderId)]);
    });
  });

  it("fails loudly when it releases onto a slot that another user holds", async () => {
    await withOwnHolder(async () => {
      const slot = await takeHeadCoachSlot();
      const intruder = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

      try {
        await expect(releaseHeadCoachSlot(slot)).rejects.toMatchObject(UNIQUE_VIOLATION);
      } finally {
        await cleanupRaw.user.delete({ where: { id: intruder.id } });
      }
    });
  });

  describe("releaseHeadCoachSlotAfter", () => {
    it("runs the teardown while the slot is taken and releases the slot after it", async () => {
      await withOwnHolder(async (holderId) => {
        const teardown = vi.fn(async () => findHeadCoachHolders());

        await releaseHeadCoachSlotAfter(await takeHeadCoachSlot(), teardown);

        expect(teardown).toHaveResolvedWith([]);
        expect(await findHeadCoachHolders()).toEqual([holderAt(holderId)]);
      });
    });

    it("releases the slot when the teardown throws and rejects with the teardown's error", async () => {
      await withOwnHolder(async (holderId) => {
        const teardownError = new Error("teardown failed");
        const slot = await takeHeadCoachSlot();

        await expect(
          releaseHeadCoachSlotAfter(slot, () => Promise.reject(teardownError)),
        ).rejects.toBe(teardownError);
        expect(await findHeadCoachHolders()).toEqual([holderAt(holderId)]);
      });
    });

    it("keeps the teardown's error when giving the slot back fails as well", async () => {
      const outerSlot = await takeHeadCoachSlot();

      try {
        const holder = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });
        const slot = await takeHeadCoachSlot();
        const teardownError = new Error("teardown failed");

        await cleanupRaw.user.delete({ where: { id: holder.id } });

        await expect(
          releaseHeadCoachSlotAfter(slot, () => Promise.reject(teardownError)),
        ).rejects.toMatchObject({ errors: [teardownError, RECORD_NOT_FOUND] });
      } finally {
        await releaseHeadCoachSlot(outerSlot);
      }
    });

    it("surfaces the release's error when only giving the slot back fails", async () => {
      await withOwnHolder(async () => {
        const slot = await takeHeadCoachSlot();
        const intruder = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

        try {
          await expect(
            releaseHeadCoachSlotAfter(slot, () => Promise.resolve()),
          ).rejects.toMatchObject(UNIQUE_VIOLATION);
        } finally {
          await cleanupRaw.user.delete({ where: { id: intruder.id } });
        }
      });
    });

    it("runs only the teardown when the slot was never taken", async () => {
      await withOwnHolder(async (holderId) => {
        const teardown = vi.fn(() => Promise.resolve());

        await expect(releaseHeadCoachSlotAfter(undefined, teardown)).resolves.toBeUndefined();
        expect(teardown).toHaveBeenCalledOnce();
        expect(await findHeadCoachHolders()).toEqual([holderAt(holderId)]);
      });
    });
  });
});
