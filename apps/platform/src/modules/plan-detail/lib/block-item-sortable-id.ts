import type { BlockItem } from "@repo/contracts/lms/schema-group";

export const schemaSortableId = (schemaId: string): string => `schema:${schemaId}`;

export const groupSortableId = (groupId: string): string => `group:${groupId}`;

export const blockItemSortableId = (item: BlockItem): string =>
  item.kind === "group" ? groupSortableId(item.group.id) : schemaSortableId(item.schema.schema.id);
