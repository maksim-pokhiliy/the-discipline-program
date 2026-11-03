import type { DynamicListItemProps } from "@repo/ui";

export type RowControls = Required<
  Pick<
    DynamicListItemProps,
    "onRemove" | "onMoveUp" | "onMoveDown" | "disableMoveUp" | "disableMoveDown"
  >
>;

type RowOperations = {
  move: (from: number, to: number) => void;
  remove: (index: number) => void;
};

export const getRowControls = (
  index: number,
  count: number,
  { move, remove }: RowOperations,
): RowControls => ({
  onRemove: () => remove(index),
  onMoveUp: () => move(index, index - 1),
  onMoveDown: () => move(index, index + 1),
  disableMoveUp: index === 0,
  disableMoveDown: index === count - 1,
});
