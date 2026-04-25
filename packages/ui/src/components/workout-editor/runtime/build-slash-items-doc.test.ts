import { describe, expect, it } from "vitest";

import type { BlockType } from "@repo/contracts/library/block-type";

import { buildSlashItemsDoc } from "./build-slash-items-doc";

const makeBlockType = (
  overrides: Partial<BlockType> & { slug: string; name: string },
): BlockType => ({
  id: `bt-${overrides.slug}`,
  description: null,
  iconKey: null,
  colorKey: null,
  sortOrder: 0,
  active: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const SEED_BLOCK_TYPES: ReadonlyArray<BlockType> = [
  makeBlockType({ slug: "warm-up", name: "Warm-up" }),
  makeBlockType({ slug: "skill", name: "Skill" }),
  makeBlockType({ slug: "strength", name: "Strength" }),
  makeBlockType({ slug: "accessory", name: "Accessory" }),
  makeBlockType({ slug: "conditioning", name: "Conditioning" }),
  makeBlockType({ slug: "main", name: "Main" }),
  makeBlockType({ slug: "cooldown", name: "Cooldown" }),
  makeBlockType({ slug: "notes", name: "Notes" }),
  makeBlockType({ slug: "text-callout", name: "Text Callout" }),
];

describe("buildSlashItemsDoc", () => {
  it("returns one item per block type when query is empty", () => {
    const items = buildSlashItemsDoc("", SEED_BLOCK_TYPES);

    expect(items).toHaveLength(SEED_BLOCK_TYPES.length);

    items.forEach((item) => {
      expect(item.kind).toBe("add-block");
    });
  });

  it("filters by name substring case-insensitively", () => {
    const items = buildSlashItemsDoc("warm", SEED_BLOCK_TYPES);

    expect(items).toHaveLength(1);

    const first = items[0];

    expect(first?.kind).toBe("add-block");

    if (first?.kind === "add-block") {
      expect(first.blockTypeSlug).toBe("warm-up");
      expect(first.label).toBe("Warm-up");
    }
  });

  it("filters by slug substring case-insensitively", () => {
    const items = buildSlashItemsDoc("STR", SEED_BLOCK_TYPES);

    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("add-block");

    if (items[0]?.kind === "add-block") {
      expect(items[0].blockTypeSlug).toBe("strength");
    }
  });

  it("filters by description substring", () => {
    const blockTypes: BlockType[] = [
      makeBlockType({
        slug: "warm-up",
        name: "Warm-up",
        description: "raise heart rate gradually",
      }),
      makeBlockType({ slug: "main", name: "Main", description: "primary work" }),
    ];

    const items = buildSlashItemsDoc("heart", blockTypes);

    expect(items).toHaveLength(1);

    if (items[0]?.kind === "add-block") {
      expect(items[0].blockTypeSlug).toBe("warm-up");
    }
  });

  it("returns no items when nothing matches", () => {
    const items = buildSlashItemsDoc("nonexistent-thing", SEED_BLOCK_TYPES);

    expect(items).toHaveLength(0);
  });

  it("populates id, blockTypeId, and label from the block type", () => {
    const items = buildSlashItemsDoc("warm", SEED_BLOCK_TYPES);
    const first = items[0];

    expect(first?.kind).toBe("add-block");

    if (first?.kind === "add-block") {
      expect(first.id).toBe("add-block-bt-warm-up");
      expect(first.blockTypeId).toBe("bt-warm-up");
      expect(first.label).toBe("Warm-up");
    }
  });
});
