import { describe, expect, it } from "vitest";

import { type SchemaRow } from "../schema-row";

import { type RowGroup } from "./row-group.types";
import { buildRowItems } from "./row-items";

const cuid = (suffix: string): string => `clz${suffix.padEnd(22, "0").slice(0, 22)}`;

function makeRow(id: string, order: number, rowGroupId: string | null): SchemaRow {
  return {
    id: cuid(id),
    schemaId: cuid("schema"),
    order,
    exerciseId: cuid("exercise"),
    sets: null,
    rowGroupId: rowGroupId === null ? null : cuid(rowGroupId),
    load: null,
    reps: null,
    side: null,
    tempo: null,
    media: null,
    intensity: null,
    rest: null,
    modifiers: [],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeGroup(id: string): RowGroup {
  return {
    id: cuid(id),
    schemaId: cuid("schema"),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("buildRowItems", () => {
  it("returns an empty array for no rows and no groups", () => {
    expect(buildRowItems([], [])).toEqual([]);
  });

  it("emits each ungrouped row as a row item", () => {
    const items = buildRowItems([makeRow("r1", 10, null), makeRow("r2", 20, null)], []);

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.kind === "row")).toBe(true);
  });

  it("clusters grouped rows into a single group item with members sorted by order", () => {
    const group = makeGroup("g1");
    const items = buildRowItems([makeRow("m2", 20, "g1"), makeRow("m1", 10, "g1")], [group]);

    expect(items).toHaveLength(1);

    const [item] = items;

    expect(item?.kind).toBe("group");

    if (item?.kind === "group") {
      expect(item.group.id).toBe(group.id);
      expect(item.members).toHaveLength(2);
      expect(item.members[0]?.order).toBe(10);
      expect(item.members[1]?.order).toBe(20);
    }
  });

  it("orders items by representative order: group at min member order, row at its order", () => {
    const group = makeGroup("g1");
    const items = buildRowItems(
      [
        makeRow("before", 5, null),
        makeRow("m2", 30, "g1"),
        makeRow("m1", 20, "g1"),
        makeRow("after", 40, null),
      ],
      [group],
    );

    expect(items.map((item) => item.kind)).toEqual(["row", "group", "row"]);

    const groupItem = items[1];

    if (groupItem?.kind === "group") {
      expect(groupItem.members.map((m) => m.order)).toEqual([20, 30]);
    }
  });

  it("interleaves multiple groups and rows by representative order", () => {
    const groupA = makeGroup("ga");
    const groupB = makeGroup("gb");
    const items = buildRowItems(
      [
        makeRow("mb1", 100, "gb"),
        makeRow("ma1", 10, "ga"),
        makeRow("plain", 50, null),
        makeRow("ma2", 20, "ga"),
      ],
      [groupA, groupB],
    );

    expect(items).toHaveLength(3);
    expect(items[0]?.kind).toBe("group");
    expect(items[1]?.kind).toBe("row");
    expect(items[2]?.kind).toBe("group");

    if (items[0]?.kind === "group") {
      expect(items[0].group.id).toBe(groupA.id);
    }

    if (items[2]?.kind === "group") {
      expect(items[2].group.id).toBe(groupB.id);
    }
  });

  it("skips a group with no members present (empty box auto-drops)", () => {
    const items = buildRowItems([makeRow("r1", 10, null)], [makeGroup("empty")]);

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("row");
  });

  it("falls back to a row item when a row's rowGroupId has no matching group (never drops a row)", () => {
    const items = buildRowItems([makeRow("orphan", 10, "ghost")], []);

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("row");
  });
});
