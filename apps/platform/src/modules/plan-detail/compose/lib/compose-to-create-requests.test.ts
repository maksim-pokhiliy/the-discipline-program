import { describe, expect, it } from "vitest";

import { compositionSchema } from "@repo/contracts/lms/composition";
import { createSchemaRowSchema } from "@repo/contracts/lms/schema-row";

import { MOCK_SEED } from "../compose-mock-seed";
import type { ComposeBlock, ComposeContainer, ComposeNode } from "../compose-tree.types";

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

const eachRow = (nodes: CreateSchemaPlanNode[]): CreateSchemaPlanNode["rows"] => {
  const rows: CreateSchemaPlanNode["rows"] = [];

  const walk = (node: CreateSchemaPlanNode): void => {
    rows.push(...node.rows);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return rows;
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

  it("rejects a parallel arrangement block via the frozen schema", () => {
    const block = blockByLabel("Parallel ladders into AMRAP");

    const result = composeRootToCreatePlan(mountRoot([block.root]));

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.some((issue) => issue.path.includes("composition"))).toBe(true);
    }
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

  it("rejects a bare parallel container built by hand (frozen-schema rejection, no special branch)", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("bare-parallel"),
      header: null,
      notes: null,
      arrangement: { kind: "parallel" },
      children: [],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);
  });

  it("rejects a bare superset container via the frozen schema", () => {
    const container: ComposeContainer = {
      nodeType: "container",
      id: asNodeId("bare-superset"),
      header: null,
      notes: null,
      arrangement: { kind: "superset" },
      children: [],
    };

    const result = composeRootToCreatePlan(mountRoot([container]));

    expect(result.ok).toBe(false);
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
