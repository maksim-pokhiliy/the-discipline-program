import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AppLevelValue, CreateLabelData, Label } from "@repo/contracts/lms/label";

const NOW = new Date("2026-01-06T00:00:00.000Z");

const mutateAsyncMock = vi.fn<(data: CreateLabelData) => Promise<Label>>();

vi.mock("./use-create-label", () => ({
  useCreateLabel: () => ({ mutateAsync: mutateAsyncMock }),
}));

const { useCreateLabelOption } = await import("./use-create-label-option");

const makeLabel = (overrides: Partial<Label> & Pick<Label, "id" | "name">): Label => ({
  nameLower: overrides.name.toLowerCase(),
  applicableLevels: ["DAY"],
  notes: null,
  rest: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

afterEach(() => {
  mutateAsyncMock.mockReset();
});

describe("useCreateLabelOption", () => {
  it.each<AppLevelValue>(["SESSION", "BLOCK"])(
    "mints a non-rest single-level label for the %s surface (rest never true inline)",
    async (level) => {
      const minted = makeLabel({ id: "lab-1", name: "Tempo", applicableLevels: [level] });

      mutateAsyncMock.mockResolvedValueOnce(minted);

      const { result } = renderHook(() => useCreateLabelOption(level));

      const option = await result.current("Tempo");

      expect(mutateAsyncMock).toHaveBeenCalledWith({
        name: "Tempo",
        applicableLevels: [level],
        rest: false,
      });
      expect(option).toEqual({ id: "lab-1", label: "Tempo" });
    },
  );

  it("resolves to null when the mint fails (mint tolerance)", async () => {
    mutateAsyncMock.mockRejectedValueOnce(new Error("conflict"));

    const { result } = renderHook(() => useCreateLabelOption("DAY"));

    const option = await result.current("Mobility");

    expect(option).toBeNull();
  });
});
