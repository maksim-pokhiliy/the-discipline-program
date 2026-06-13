import { describe, expect, it } from "vitest";

import { type SchemaWithBody } from "../schema";

import { buildBlockItems } from "./block-items";
import { type SchemaGroup } from "./schema-group.types";

const cuid = (suffix: string): string => `clz${suffix.padEnd(22, "0").slice(0, 22)}`;

function makeSchema(id: string, order: number, groupId: string | null): SchemaWithBody {
  return {
    schema: {
      id: cuid(id),
      blockId: cuid("block"),
      groupId: groupId === null ? null : cuid(groupId),
      order,
      header: null,
      intensity: null,
      composition: null,
      label: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    rows: [],
    rowGroups: [],
  };
}

function makeGroup(id: string): SchemaGroup {
  return {
    id: cuid(id),
    blockId: cuid("block"),
    notes: null,
    interleaveOrder: "round_by_round",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("buildBlockItems", () => {
  it("returns an empty array for no schemas and no groups", () => {
    expect(buildBlockItems([], [])).toEqual([]);
  });

  it("emits each ungrouped schema as a schema item", () => {
    const items = buildBlockItems([makeSchema("s1", 10, null), makeSchema("s2", 20, null)], []);

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.kind === "schema")).toBe(true);
  });

  it("clusters grouped schemas into a single group item with members sorted by order", () => {
    const group = makeGroup("g1");
    const items = buildBlockItems(
      [makeSchema("m2", 20, "g1"), makeSchema("m1", 10, "g1")],
      [group],
    );

    expect(items).toHaveLength(1);

    const [item] = items;

    expect(item?.kind).toBe("group");

    if (item?.kind === "group") {
      expect(item.group.id).toBe(group.id);
      expect(item.members).toHaveLength(2);
      expect(item.members[0]?.schema.order).toBe(10);
      expect(item.members[1]?.schema.order).toBe(20);
    }
  });

  it("orders items by representative order: group at min member order, schema at its order", () => {
    const group = makeGroup("g1");
    const items = buildBlockItems(
      [
        makeSchema("before", 5, null),
        makeSchema("m2", 30, "g1"),
        makeSchema("m1", 20, "g1"),
        makeSchema("after", 40, null),
      ],
      [group],
    );

    expect(items.map((item) => item.kind)).toEqual(["schema", "group", "schema"]);

    const groupItem = items[1];

    if (groupItem?.kind === "group") {
      expect(groupItem.members.map((m) => m.schema.order)).toEqual([20, 30]);
    }
  });

  it("interleaves multiple groups and schemas by representative order", () => {
    const groupA = makeGroup("ga");
    const groupB = makeGroup("gb");
    const items = buildBlockItems(
      [
        makeSchema("mb1", 100, "gb"),
        makeSchema("ma1", 10, "ga"),
        makeSchema("plain", 50, null),
        makeSchema("ma2", 20, "ga"),
      ],
      [groupA, groupB],
    );

    expect(items).toHaveLength(3);
    expect(items[0]?.kind).toBe("group");
    expect(items[1]?.kind).toBe("schema");
    expect(items[2]?.kind).toBe("group");

    if (items[0]?.kind === "group") {
      expect(items[0].group.id).toBe(groupA.id);
    }

    if (items[2]?.kind === "group") {
      expect(items[2].group.id).toBe(groupB.id);
    }
  });

  it("skips a group with no members present (cannot position or render an empty box)", () => {
    const items = buildBlockItems([makeSchema("s1", 10, null)], [makeGroup("empty")]);

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("schema");
  });

  it("falls back to a schema item when a schema's groupId has no matching group (never drops a schema)", () => {
    const items = buildBlockItems([makeSchema("orphan", 10, "ghost")], []);

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("schema");
  });
});
