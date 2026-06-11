import { describe, expect, it } from "vitest";

import { schemaRowPayloadSchema } from "../schema-row";

import { composeContainerSchema, compositionSchema } from "./composition.schema";
import type { ComposeNode, ComposeRow } from "./composition.types";

const cuidFran = "clz000000000000000000fran";
const cuidThrusters = "clz00000000000000000thrust";
const cuidPullups = "clz00000000000000000pullup";

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

const franComposition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
} as const;

const franContainer: ComposeNode = {
  nodeType: "container",
  id: cuidFran,
  header: "Fran",
  notes: null,
  composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
  children: [exerciseRow(cuidThrusters), exerciseRow(cuidPullups)],
};

describe("Fran — round-counter ladder (container repetition axis)", () => {
  it("validates a container ladder over two ordered EXERCISE rows", () => {
    expect(compositionSchema.safeParse(franComposition).success).toBe(true);
    expect(composeContainerSchema.safeParse(franContainer).success).toBe(true);
  });

  it("carries EXERCISE rows only — no marker row kind survives", () => {
    for (const child of franContainer.children) {
      expect(child.nodeType === "row" && child.rowKind).toBe("EXERCISE");
    }
  });
});

describe("D-MARKER-DEATH — the rep-scheme marker is unrepresentable", () => {
  it("rejects the dropped INNER_LADDER_MARKER row payload", () => {
    expect(
      schemaRowPayloadSchema.safeParse({ rowKind: "INNER_LADDER_MARKER", steps: [21, 15, 9] })
        .success,
    ).toBe(false);
  });

  it("rejects a ladder container that tries to carry a marker child (fusion bug now unbuildable)", () => {
    expect(
      composeContainerSchema.safeParse({
        nodeType: "container",
        id: cuidFran,
        header: "Collision",
        notes: null,
        composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
        children: [
          {
            nodeType: "row",
            id: cuidThrusters,
            rowKind: "INNER_LADDER_MARKER",
            rowPayload: { rowKind: "INNER_LADDER_MARKER", steps: [21, 15, 9] },
            reps: null,
            load: null,
            side: null,
            tempo: null,
            position: null,
            intensity: null,
            notes: null,
          },
        ],
      }).success,
    ).toBe(false);
  });
});
