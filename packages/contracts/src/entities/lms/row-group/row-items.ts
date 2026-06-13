import { type SchemaRow } from "../schema-row";

import { type RowGroup } from "./row-group.types";

export type RowItem =
  | { kind: "row"; row: SchemaRow }
  | { kind: "group"; group: RowGroup; members: SchemaRow[] };

type OrderedRowItem = { order: number; item: RowItem };

export const buildRowItems = (rows: SchemaRow[], rowGroups: RowGroup[]): RowItem[] => {
  const membersByGroupId = new Map<string, SchemaRow[]>();
  const ungrouped: SchemaRow[] = [];

  for (const row of rows) {
    const { rowGroupId } = row;

    if (rowGroupId === null) {
      ungrouped.push(row);
      continue;
    }

    const bucket = membersByGroupId.get(rowGroupId);

    if (bucket === undefined) {
      membersByGroupId.set(rowGroupId, [row]);
    } else {
      bucket.push(row);
    }
  }

  const ordered: OrderedRowItem[] = [];

  for (const group of rowGroups) {
    const members = membersByGroupId.get(group.id);

    if (members === undefined || members.length === 0) {
      continue;
    }

    membersByGroupId.delete(group.id);

    const sortedMembers = [...members].sort((a, b) => a.order - b.order);
    const representativeOrder = sortedMembers[0]?.order ?? 0;

    ordered.push({
      order: representativeOrder,
      item: { kind: "group", group, members: sortedMembers },
    });
  }

  for (const orphanedMembers of membersByGroupId.values()) {
    for (const row of orphanedMembers) {
      ungrouped.push(row);
    }
  }

  for (const row of ungrouped) {
    ordered.push({ order: row.order, item: { kind: "row", row } });
  }

  return ordered.sort((a, b) => a.order - b.order).map((entry) => entry.item);
};
