import { describe, expect, it } from "vitest";

import { composeContainerSchema, compositionSchema } from "./composition.schema";
import type { ComposeContainer, ComposeRow } from "./composition.types";

const cuidFran = "clz000000000000000000fran";
const cuidThrusters = "clz00000000000000000thrust";
const cuidPullups = "clz00000000000000000pullup";

function exerciseRow(id: string): ComposeRow {
  return {
    nodeType: "row",
    id,
    exerciseId: id,
    reps: null,
    load: null,
    side: null,
    tempo: null,
    media: null,
    notes: null,
  };
}

const franComposition = {
  repetition: { kind: "ladder", steps: [21, 15, 9] },
} as const;

const franContainer: ComposeContainer = {
  nodeType: "container",
  id: cuidFran,
  header: "Fran",
  notes: null,
  composition: { repetition: { kind: "ladder", steps: [21, 15, 9] } },
  children: [exerciseRow(cuidThrusters), exerciseRow(cuidPullups)],
};

describe("Fran — round-counter ladder (container repetition axis)", () => {
  it("validates a container ladder over two ordered exercise rows", () => {
    expect(compositionSchema.safeParse(franComposition).success).toBe(true);
    expect(composeContainerSchema.safeParse(franContainer).success).toBe(true);
  });

  it("carries plain exercise rows only — no marker row kind survives", () => {
    for (const child of franContainer.children) {
      expect(child.nodeType).toBe("row");
    }
  });
});

describe("D-MARKER-DEATH — the rep-scheme marker is unrepresentable", () => {
  it("rejects a ladder container that tries to carry a marker child (strict rejects unknown keys)", () => {
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
            exerciseId: cuidThrusters,
            reps: null,
            load: null,
            side: null,
            tempo: null,
            media: null,
            notes: null,
            steps: [21, 15, 9],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
