import { describe, expect, it } from "vitest";

import { compositionSchema } from "@repo/contracts/lms/composition";
import { createSchemaRowSchema } from "@repo/contracts/lms/schema-row";

import { MOCK_SEED } from "../compose-mock-seed";
import type {
  ComposeBlock,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  RepetitionAxis,
} from "../compose-tree.types";

import {
  composeRootToCreatePlan,
  type ConvertResult,
  type CreateSchemaPlanNode,
} from "./compose-to-create-requests";
import { asNodeId } from "./id-factory";
import { makeRow } from "./make-row";

const allBlocks = (): ComposeBlock[] =>
  MOCK_SEED.weeks.flatMap((week) =>
    week.days.flatMap((day) => day.sessions.flatMap((session) => session.blocks)),
  );

const blockByLabel = (label: string): ComposeBlock => {
  const found = allBlocks().find((block) => block.label === label);

  if (found === undefined) {
    throw new Error(`fixture block not found: ${label}`);
  }

  return found;
};

const mountRoot = (children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("mount-root"),
  header: null,
  notes: null,
  children,
});

const expectOk = (result: ConvertResult): CreateSchemaPlanNode[] => {
  if (!result.ok) {
    throw new Error(`expected ok, got issues: ${JSON.stringify(result.issues)}`);
  }

  return result.nodes;
};

const eachComposition = (nodes: CreateSchemaPlanNode[]): unknown[] => {
  const compositions: unknown[] = [];

  const walk = (node: CreateSchemaPlanNode): void => {
    compositions.push(node.schema.composition);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return compositions;
};

const eachRow = (nodes: CreateSchemaPlanNode[]): CreateSchemaPlanNode["rows"][number]["row"][] => {
  const rows: CreateSchemaPlanNode["rows"][number]["row"][] = [];

  const walk = (node: CreateSchemaPlanNode): void => {
    rows.push(...node.rows.map((entry) => entry.row));
    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return rows;
};

const findDeferred = (
  nodes: CreateSchemaPlanNode[],
  kind: "parallel" | "superset",
): CreateSchemaPlanNode | undefined => {
  const walk = (node: CreateSchemaPlanNode): CreateSchemaPlanNode | undefined => {
    if (node.deferredArrangement?.kind === kind) {
      return node;
    }

    for (const child of node.children) {
      const found = walk(child);

      if (found !== undefined) {
        return found;
      }
    }

    return undefined;
  };

  for (const node of nodes) {
    const found = walk(node);

    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};

const SIMPLE_AXES_BLOCKS = [
  "EMOM 16 / 4 rounds",
  "Intervals, max in remaining",
  "Strict gymnastics ladder",
  "Back squat wave",
];

describe("composeRootToCreatePlan", () => {
  it.each(SIMPLE_AXES_BLOCKS)("converts the %s gauntlet block to ok", (label) => {
    const block = blockByLabel(label);

    const result = composeRootToCreatePlan(mountRoot([block.root]));

    expect(result.ok).toBe(true);
  });

  it.each(SIMPLE_AXES_BLOCKS)("emits frozen-valid compositions for %s", (label) => {
    const block = blockByLabel(label);
    const nodes = expectOk(composeRootToCreatePlan(mountRoot([block.root])));

    for (const composition of eachComposition(nodes)) {
      expect(compositionSchema.safeParse(composition).success).toBe(true);
    }
  });

  it.each(SIMPLE_AXES_BLOCKS)("emits createSchemaRow-valid row payloads for %s", (label) => {
    const block = blockByLabel(label);
    const nodes = expectOk(composeRootToCreatePlan(mountRoot([block.root])));

    for (const row of eachRow(nodes)) {
      const candidate = { schemaId: "ckna1b2c3d4e5f6g7h8i9j0k1", ...row };

      expect(createSchemaRowSchema.safeParse(candidate).success).toBe(true);
    }
  });

  it("converts the valid parallel gauntlet block to ok with a deferred arrangement", () => {
    const block = blockByLabel("Parallel ladders into AMRAP");

    const nodes = expectOk(composeRootToCreatePlan(mountRoot([block.root])));
    const parallel = findDeferred(nodes, "parallel");

    expect(parallel).not.toBeUndefined();
    expect(parallel?.deferredArrangement?.kind).toBe("parallel");
    expect(parallel?.schema.composition).not.toHaveProperty("arrangement");
  });

  it("converts the valid superset gauntlet block to ok with a deferred arrangement", () => {
    const block = blockByLabel("Superset finisher");

    const nodes = expectOk(composeRootToCreatePlan(mountRoot([block.root])));
    const superset = findDeferred(nodes, "superset");

    expect(superset).not.toBeUndefined();
    expect(superset?.deferredArrangement?.kind).toBe("superset");
    expect(superset?.schema.composition).not.toHaveProperty("arrangement");
  });

  it("rejects an uncommitted row", () => {
    const uncommitted = makeRow("EXERCISE");
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("container-with-uncommitted"),
      header: null,
      notes: null,
      children: [uncommitted],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.some((issue) => issue.message === "row is not configured")).toBe(true);
    }
  });

  it("rejects a root that carries composition axes", () => {
    const root: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("axis-root"),
      header: null,
      notes: null,
      repetition: { kind: "count", count: 3 },
      children: [],
    };

    const result = composeRootToCreatePlan(root);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path === "root")).toBe(true);
    }
  });

  it("rejects an under-filled parallel container as an arrangement cardinality issue", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("bare-parallel"),
      header: null,
      notes: null,
      arrangement: { kind: "parallel", interleaveOrder: "round_by_round", tracks: [] },
      children: [],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("composition.arrangement"))).toBe(
        true,
      );
    }
  });

  it("rejects an under-filled superset container as an arrangement cardinality issue", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("bare-superset"),
      header: null,
      notes: null,
      arrangement: { kind: "superset", pairs: [] },
      children: [],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("composition.arrangement"))).toBe(
        true,
      );
    }
  });

  it("rejects a parallel with a single track and a dangling childSchemaId", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("dangling-parallel"),
      header: null,
      notes: null,
      arrangement: {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [{ childSchemaId: asNodeId("not-a-child") }],
      },
      children: [],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("tracks"))).toBe(true);
    }
  });

  it("omits an ordered arrangement from the emitted composition", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("ordered-container"),
      header: null,
      notes: null,
      arrangement: { kind: "ordered" },
      children: [],
    };

    const nodes = expectOk(composeRootToCreatePlan(mountRoot([container])));

    expect(nodes[0]?.schema.composition).toEqual({});
  });

  it("round-trips a count repetition as a number", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("count-number"),
      header: null,
      notes: null,
      repetition: { kind: "count", count: 5 },
      children: [],
    };

    const nodes = expectOk(composeRootToCreatePlan(mountRoot([container])));

    expect(nodes[0]?.schema.composition).toEqual({ repetition: { kind: "count", count: 5 } });
  });

  it("round-trips a count repetition as a min/max range", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("count-range"),
      header: null,
      notes: null,
      repetition: { kind: "count", count: { min: 3, max: 5 } },
      children: [],
    };

    const nodes = expectOk(composeRootToCreatePlan(mountRoot([container])));

    expect(nodes[0]?.schema.composition).toEqual({
      repetition: { kind: "count", count: { min: 3, max: 5 } },
    });
  });

  it("round-trips ladder, cadence, interval, timeCap and window repetitions", () => {
    const ladder: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("rep-ladder"),
      header: null,
      notes: null,
      repetition: { kind: "ladder", steps: [21, 15, 9] },
      children: [],
    };
    const cadence: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("rep-cadence"),
      header: null,
      notes: null,
      repetition: { kind: "cadence", everyMin: 1, rounds: 16 },
      children: [],
    };
    const interval: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("rep-interval"),
      header: null,
      notes: null,
      repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 },
      children: [],
    };
    const timeCap: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("rep-timecap"),
      header: null,
      notes: null,
      repetition: { kind: "timeCap", cap: { min: 5, unit: "min" } },
      children: [],
    };
    const window: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("rep-window"),
      header: null,
      notes: null,
      repetition: { kind: "window", startHhMm: "09:00", endHhMm: "10:30" },
      children: [],
    };

    const nodes = expectOk(
      composeRootToCreatePlan(mountRoot([ladder, cadence, interval, timeCap, window])),
    );

    expect(nodes.map((node) => node.schema.composition)).toEqual([
      { repetition: { kind: "ladder", steps: [21, 15, 9] } },
      { repetition: { kind: "cadence", everyMin: 1, rounds: 16 } },
      { repetition: { kind: "interval", workMin: 2, offMin: 1, count: 3 } },
      { repetition: { kind: "timeCap", cap: { min: 5, unit: "min" } } },
      { repetition: { kind: "window", startHhMm: "09:00", endHhMm: "10:30" } },
    ]);
  });

  it("collects all issues rather than bailing on the first", () => {
    const firstUncommitted = makeRow("EXERCISE");
    const secondUncommitted = makeRow("EXERCISE");
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("multi-issue"),
      header: null,
      notes: null,
      children: [firstUncommitted, secondUncommitted],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

const repetitionContainer = (id: string, repetition: RepetitionAxis): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  repetition,
  children: [],
});

const committedRow = (
  rowKind: ComposeRow["rowKind"],
  rowPayload: ComposeRow["rowPayload"],
): ComposeRow => ({
  nodeType: "row",
  id: asNodeId(`committed-${rowKind}`),
  rowKind,
  rowPayload,
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: null,
});

describe("composeRootToCreatePlan out-of-bounds axes (frozen safeParse gate, never throws)", () => {
  it("rejects a count range with min greater than max without throwing", () => {
    const container = repetitionContainer("count-min-gt-max", {
      kind: "count",
      count: { min: 5, max: 3 },
    });

    const run = () => composeRootToCreatePlan(mountRoot([container]));

    expect(run).not.toThrow();
    expect(run().ok).toBe(false);
  });

  it("rejects a zero count without throwing", () => {
    const container = repetitionContainer("count-zero", { kind: "count", count: 0 });

    const run = () => composeRootToCreatePlan(mountRoot([container]));

    expect(run).not.toThrow();
    expect(run().ok).toBe(false);
  });

  it("rejects a negative count without throwing", () => {
    const container = repetitionContainer("count-negative", { kind: "count", count: -2 });

    const run = () => composeRootToCreatePlan(mountRoot([container]));

    expect(run).not.toThrow();
    expect(run().ok).toBe(false);
  });

  it("rejects a ladder with a negative step without throwing", () => {
    const container = repetitionContainer("ladder-negative-step", {
      kind: "ladder",
      steps: [21, -15, 9],
    });

    const run = () => composeRootToCreatePlan(mountRoot([container]));

    expect(run).not.toThrow();
    expect(run().ok).toBe(false);
  });

  it("rejects a window whose end is not after its start without throwing", () => {
    const container = repetitionContainer("window-end-before-start", {
      kind: "window",
      startHhMm: "10:30",
      endHhMm: "09:00",
    });

    const run = () => composeRootToCreatePlan(mountRoot([container]));

    expect(run).not.toThrow();
    expect(run().ok).toBe(false);
  });
});

describe("composeRootToCreatePlan does not catch the ladder/marker collision (QA-001 is server-side)", () => {
  it("passes a ladder container holding an INNER_LADDER_MARKER row as ok (server in-tx guard rejects it later)", () => {
    const marker = committedRow("INNER_LADDER_MARKER", {
      rowKind: "INNER_LADDER_MARKER",
      steps: [21, 15, 9],
    });
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("ladder-with-marker"),
      header: null,
      notes: null,
      repetition: { kind: "ladder", steps: [21, 15, 9] },
      children: [marker],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(true);

    if (result.ok) {
      const node = result.nodes[0];

      expect(node?.schema.composition).toEqual({
        repetition: { kind: "ladder", steps: [21, 15, 9] },
      });
      expect(node?.rows).toHaveLength(1);
      expect(node?.rows[0]?.row.rowKind).toBe("INNER_LADDER_MARKER");
    }
  });
});
