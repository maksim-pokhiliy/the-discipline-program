import { describe, expect, it, vi } from "vitest";

import { getRowControls } from "./row-controls";

const ROW_COUNT = 3;
const LAST_ROW_INDEX = ROW_COUNT - 1;
const MIDDLE_ROW_INDEX = 1;

const makeOperations = () => ({ move: vi.fn(), remove: vi.fn() });

describe("getRowControls", () => {
  it("marks move up unavailable on the first row", () => {
    const controls = getRowControls(0, ROW_COUNT, makeOperations());

    expect(controls.canMoveUp).toBe(false);
    expect(controls.canMoveDown).toBe(true);
  });

  it("marks move down unavailable on the last row", () => {
    const controls = getRowControls(LAST_ROW_INDEX, ROW_COUNT, makeOperations());

    expect(controls.canMoveUp).toBe(true);
    expect(controls.canMoveDown).toBe(false);
  });

  it("marks both moves unavailable on a single row", () => {
    const controls = getRowControls(0, 1, makeOperations());

    expect(controls.canMoveUp).toBe(false);
    expect(controls.canMoveDown).toBe(false);
  });

  it("enables both moves on a middle row", () => {
    const controls = getRowControls(MIDDLE_ROW_INDEX, ROW_COUNT, makeOperations());

    expect(controls.canMoveUp).toBe(true);
    expect(controls.canMoveDown).toBe(true);
  });

  it("moves a row one place up and one place down", () => {
    const operations = makeOperations();
    const controls = getRowControls(MIDDLE_ROW_INDEX, ROW_COUNT, operations);

    controls.onMoveUp();
    controls.onMoveDown();

    expect(operations.move.mock.calls).toEqual([
      [MIDDLE_ROW_INDEX, 0],
      [MIDDLE_ROW_INDEX, LAST_ROW_INDEX],
    ]);
  });

  it("removes the row at its own index", () => {
    const operations = makeOperations();
    const controls = getRowControls(MIDDLE_ROW_INDEX, ROW_COUNT, operations);

    controls.onRemove();

    expect(operations.remove).toHaveBeenCalledExactlyOnceWith(MIDDLE_ROW_INDEX);
  });
});
