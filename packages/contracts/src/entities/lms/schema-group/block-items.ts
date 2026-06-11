import { type SchemaWithBody } from "../schema";

import { type SchemaGroup } from "./schema-group.types";

export type BlockItem =
  | { kind: "schema"; schema: SchemaWithBody }
  | { kind: "group"; group: SchemaGroup; members: SchemaWithBody[] };

type OrderedBlockItem = { order: number; item: BlockItem };

export const buildBlockItems = (schemas: SchemaWithBody[], groups: SchemaGroup[]): BlockItem[] => {
  const membersByGroupId = new Map<string, SchemaWithBody[]>();
  const ungrouped: SchemaWithBody[] = [];

  for (const entry of schemas) {
    const { groupId } = entry.schema;

    if (groupId === null) {
      ungrouped.push(entry);
      continue;
    }

    const bucket = membersByGroupId.get(groupId);

    if (bucket === undefined) {
      membersByGroupId.set(groupId, [entry]);
    } else {
      bucket.push(entry);
    }
  }

  const ordered: OrderedBlockItem[] = [];

  for (const group of groups) {
    const members = membersByGroupId.get(group.id);

    if (members === undefined || members.length === 0) {
      continue;
    }

    membersByGroupId.delete(group.id);

    const sortedMembers = [...members].sort((a, b) => a.schema.order - b.schema.order);
    const representativeOrder = sortedMembers[0]?.schema.order ?? 0;

    ordered.push({
      order: representativeOrder,
      item: { kind: "group", group, members: sortedMembers },
    });
  }

  for (const orphanedMembers of membersByGroupId.values()) {
    for (const entry of orphanedMembers) {
      ungrouped.push(entry);
    }
  }

  for (const entry of ungrouped) {
    ordered.push({ order: entry.schema.order, item: { kind: "schema", schema: entry } });
  }

  return ordered.sort((a, b) => a.order - b.order).map((entry) => entry.item);
};
