import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../schema-row";

import { deriveCompositionLabel, isStructurallyParallel } from "./composition-label";
import { composeContainerSchema, compositionSchema } from "./composition.schema";
import type { ComposeNode, ComposeRow, Composition } from "./composition.types";

const cuidFran = "clz000000000000000000fran";
const cuidThrusters = "clz00000000000000000thrust";
const cuidPullups = "clz00000000000000000pullup";
const cuidBlockC = "clz0000000000000000blockc1";
const cuidThrTrack = "clz00000000000000thrtrack1";
const cuidPulTrack = "clz00000000000000pultrack1";

type LadderSource = "container.repetition" | "row.payload" | "none";

function ladderSource(node: ComposeNode): LadderSource {
  if (node.nodeType === "container" && node.composition.repetition?.kind === "ladder") {
    return "container.repetition";
  }

  if (node.nodeType === "row" && node.rowPayload.rowKind === "INNER_LADDER_MARKER") {
    return "row.payload";
  }

  return "none";
}

function exerciseRow(id: string): ComposeRow {
  return {
    nodeType: "row",
    id,
    rowKind: "EXERCISE",
    rowPayload: { rowKind: "EXERCISE", exercise: { form: "atomic", exerciseId: id } },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };
}

function ladderMarkerRow(id: string, steps: number[]): ComposeRow {
  return {
    nodeType: "row",
    id,
    rowKind: "INNER_LADDER_MARKER",
    rowPayload: { rowKind: "INNER_LADDER_MARKER", steps },
    reps: null,
    load: null,
    side: null,
    tempo: null,
    position: null,
    intensity: null,
    notes: null,
  };
}

const franComposition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
  arrangement: { kind: "ordered" },
} as const;

const franThrustersRow = exerciseRow(cuidThrusters);
const franPullupsRow = exerciseRow(cuidPullups);

const franContainer: ComposeNode = {
  nodeType: "container",
  id: cuidFran,
  header: "Fran",
  notes: null,
  composition: {
    repetition: { kind: "ladder", steps: [21, 15, 9] },
    arrangement: { kind: "ordered" },
  },
  children: [franThrustersRow, franPullupsRow],
};

const blockCComposition: Composition = {};

const blockCThrustersRow = ladderMarkerRow(cuidThrTrack, [21, 15, 9]);
const blockCPullupsRow = ladderMarkerRow(cuidPulTrack, [9, 15, 21]);

const blockCContainer: ComposeNode = {
  nodeType: "container",
  id: cuidBlockC,
  header: "Block C",
  notes: null,
  composition: {},
  children: [blockCThrustersRow, blockCPullupsRow],
};

describe("Fran — round-counter ladder (container repetition axis)", () => {
  it("validates a container ladder over two ordered EXERCISE children", () => {
    expect(compositionSchema.safeParse(franComposition).success).toBe(true);
    expect(composeContainerSchema.safeParse(franContainer).success).toBe(true);
  });

  it("carries no INNER_LADDER_MARKER on either child row", () => {
    expect(franThrustersRow.rowPayload.rowKind).toBe("EXERCISE");
    expect(franPullupsRow.rowPayload.rowKind).toBe("EXERCISE");
  });
});

describe("Gauntlet Block C — rep-scheme ladder (per-row INNER_LADDER_MARKER)", () => {
  it("validates the marker container with an empty composition and no repetition axis", () => {
    expect(compositionSchema.safeParse(blockCComposition).success).toBe(true);
    expect(composeContainerSchema.safeParse(blockCContainer).success).toBe(true);

    const parsed = compositionSchema.parse(blockCComposition);

    expect(parsed.repetition).toBeUndefined();
  });

  it("validates each track's steps as a SchemaRow INNER_LADDER_MARKER payload", () => {
    expect(
      schemaRowPayloadSchema.safeParse({ rowKind: "INNER_LADDER_MARKER", steps: [21, 15, 9] })
        .success,
    ).toBe(true);
    expect(
      schemaRowPayloadSchema.safeParse({ rowKind: "INNER_LADDER_MARKER", steps: [9, 15, 21] })
        .success,
    ).toBe(true);
  });
});

describe("ladder split — four-projection distinctness (anti-collision proof)", () => {
  it("resolves Fran to the container repetition source", () => {
    expect(ladderSource(franContainer)).toBe("container.repetition");
  });

  it("resolves a Block C track row to the row payload source", () => {
    expect(ladderSource(blockCThrustersRow)).toBe("row.payload");
  });

  it("resolves the two ladders to different sources", () => {
    expect(ladderSource(franContainer)).not.toBe(ladderSource(blockCThrustersRow));
  });
});

const collisionContainer: ComposeNode = {
  nodeType: "container",
  id: cuidFran,
  header: "Collision",
  notes: null,
  composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
  children: [ladderMarkerRow(cuidThrTrack, [21, 15, 9])],
};

describe("ladder split — a single container cannot hold both ladder sources", () => {
  it("rejects a round-counter ladder container that also carries a rep-scheme ladder row", () => {
    expect(composeContainerSchema.safeParse(collisionContainer).success).toBe(false);
  });

  it("keeps the canonical Fran and Block C containers valid", () => {
    expect(composeContainerSchema.safeParse(franContainer).success).toBe(true);
    expect(composeContainerSchema.safeParse(blockCContainer).success).toBe(true);
  });
});

const cuidParallelParent = "clz00000000000000parparent";
const cuidTrackA = "clz00000000000000000tracka";
const cuidTrackB = "clz00000000000000000trackb";

function containerChildCount(node: ComposeNode): number {
  if (node.nodeType !== "container") {
    return 0;
  }

  return node.children.filter((child) => child.nodeType === "container").length;
}

const parallelParentComposition: Composition = {};

const parallelParent: ComposeNode = {
  nodeType: "container",
  id: cuidParallelParent,
  header: "Parallel ladders",
  notes: null,
  composition: {},
  children: [
    {
      nodeType: "container",
      id: cuidTrackA,
      header: null,
      notes: null,
      composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      children: [exerciseRow(cuidThrusters)],
    },
    {
      nodeType: "container",
      id: cuidTrackB,
      header: null,
      notes: null,
      composition: { repetition: { kind: "ladder", steps: [15, 12, 9] } },
      children: [exerciseRow(cuidPullups)],
    },
  ],
};

describe("derived parallelism — container tracks label parallel, marker rows do not", () => {
  it("validates the axis-free parent holding two ladder-track containers", () => {
    expect(composeContainerSchema.safeParse(parallelParent).success).toBe(true);
  });

  it("labels the two-ladder-track parent as parallel via the structural predicate", () => {
    const structure = { containerChildCount: containerChildCount(parallelParent) };

    expect(isStructurallyParallel(parallelParentComposition, structure)).toBe(true);
    expect(deriveCompositionLabel(parallelParentComposition, structure)).toEqual({
      kind: "parallel",
      family: "PARALLEL",
    });
  });

  it("does not classify the marker container as structurally parallel — rows are not container children", () => {
    const structure = { containerChildCount: containerChildCount(blockCContainer) };

    expect(structure.containerChildCount).toBe(0);
    expect(isStructurallyParallel(blockCComposition, structure)).toBe(false);
    expect(deriveCompositionLabel(blockCComposition, structure)).toEqual({
      kind: "flat",
      family: "FLAT",
    });
  });
});
