import type { RowItem } from "@repo/contracts/lms/row-group";

export const rowSortableId = (rowId: string): string => `row:${rowId}`;

export const rowGroupSortableId = (rowGroupId: string): string => `rowgroup:${rowGroupId}`;

export const rowItemSortableId = (item: RowItem): string =>
  item.kind === "group" ? rowGroupSortableId(item.group.id) : rowSortableId(item.row.id);
